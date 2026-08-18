import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings

final class AppBlocker {
    static let shared = AppBlocker()

    private typealias StateMachine = BlockingStateMachine<
        ManagedSettingsShieldManager,
        FileBlockingOperationJournalStore<ShieldState>
    >

    private let operationLock = NSLock()
    private let selectionStore: AppSelectionStore
    private let stateMachine: StateMachine

    init(
        selectionStore: AppSelectionStore = .shared,
        settingsStore: ManagedSettingsStore = ManagedSettingsStore(),
        journalURL: URL = AppBlocker.defaultJournalURL,
        isAuthorized: @escaping () -> Bool = {
            AuthorizationCenter.shared.authorizationStatus == .approved
        }
    ) {
        self.selectionStore = selectionStore
        stateMachine = BlockingStateMachine(
            shields: ManagedSettingsShieldManager(settingsStore: settingsStore),
            journalStore: FileBlockingOperationJournalStore(fileURL: journalURL),
            isAuthorized: isAuthorized
        )

        operationLock.lock()
        defer { operationLock.unlock() }
        try? stateMachine.recoverInterruptedOperation()
    }

    func getLocked() throws -> Bool {
        operationLock.lock()
        defer { operationLock.unlock() }

        try stateMachine.recoverInterruptedOperation()
        return stateMachine.hasAnyShield
    }

    func saveSelection(_ selection: FamilyActivitySelection) throws {
        operationLock.lock()
        defer { operationLock.unlock() }

        try stateMachine.recoverInterruptedOperation()
        guard !stateMachine.hasAnyShield else {
            throw AppBlockerError.selectionLocked
        }
        try selectionStore.save(selection)
    }

    func setBlockingEnabled(_ enabled: Bool) throws -> BlockingResult {
        operationLock.lock()
        defer { operationLock.unlock() }

        let state = try stateMachine.setBlockingEnabled(enabled) {
            ShieldState(selection: selectionStore.load())
        }
        return blockingResult(for: state)
    }

    func clearSelection() throws {
        operationLock.lock()
        defer { operationLock.unlock() }

        _ = try stateMachine.setBlockingEnabled(false) { .empty }
        selectionStore.clear()
    }

    private func blockingResult(for state: ShieldState) -> BlockingResult {
        BlockingResult(
            status: state.isEmpty ? "unlocked" : "locked",
            locked: !state.isEmpty
        )
    }

    static var defaultJournalURL: URL {
        let applicationSupport = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        )[0]
        return applicationSupport
            .appendingPathComponent("ScanLock", isDirectory: true)
            .appendingPathComponent("blocking-operation.json")
    }
}

struct BlockingResult: Record {
    @Field var status: String = "unlocked"
    @Field var locked: Bool = false
}

struct ShieldState: BlockingStateValue {
    let applicationTokens: Set<ApplicationToken>
    let categoryTokens: Set<ActivityCategoryToken>
    let webDomainTokens: Set<WebDomainToken>

    static let empty = ShieldState(
        applicationTokens: [],
        categoryTokens: [],
        webDomainTokens: []
    )

    init(
        applicationTokens: Set<ApplicationToken>,
        categoryTokens: Set<ActivityCategoryToken>,
        webDomainTokens: Set<WebDomainToken>
    ) {
        self.applicationTokens = applicationTokens
        self.categoryTokens = categoryTokens
        self.webDomainTokens = webDomainTokens
    }

    init(selection: FamilyActivitySelection) {
        self.init(
            applicationTokens: selection.applicationTokens,
            categoryTokens: selection.categoryTokens,
            webDomainTokens: selection.webDomainTokens
        )
    }

    var isEmpty: Bool {
        applicationTokens.isEmpty && categoryTokens.isEmpty && webDomainTokens.isEmpty
    }
}

final class ManagedSettingsShieldManager: BlockingShieldManaging {
    private let settingsStore: ManagedSettingsStore

    init(settingsStore: ManagedSettingsStore) {
        self.settingsStore = settingsStore
    }

    var hasAnyShield: Bool {
        settingsStore.shield.applications != nil ||
            settingsStore.shield.applicationCategories != nil ||
            settingsStore.shield.webDomains != nil
    }

    func capture() throws -> ShieldState {
        let categoryTokens: Set<ActivityCategoryToken>
        switch settingsStore.shield.applicationCategories {
        case .some(.specific(let tokens, except: let exceptions)) where exceptions.isEmpty:
            categoryTokens = tokens
        case .some(.none), .none:
            categoryTokens = []
        default:
            throw AppBlockerError.unsupportedExistingCategoryPolicy
        }

        return ShieldState(
            applicationTokens: settingsStore.shield.applications ?? [],
            categoryTokens: categoryTokens,
            webDomainTokens: settingsStore.shield.webDomains ?? []
        )
    }

    func apply(_ state: ShieldState) {
        settingsStore.shield.applications =
            state.applicationTokens.isEmpty ? nil : state.applicationTokens
        settingsStore.shield.applicationCategories =
            state.categoryTokens.isEmpty ? nil : .specific(state.categoryTokens)
        settingsStore.shield.webDomains =
            state.webDomainTokens.isEmpty ? nil : state.webDomainTokens
    }

    func matches(_ state: ShieldState) -> Bool {
        let applicationsMatch =
            (settingsStore.shield.applications ?? []) == state.applicationTokens
        let webDomainsMatch =
            (settingsStore.shield.webDomains ?? []) == state.webDomainTokens

        let expectedCategories: ShieldSettings.ActivityCategoryPolicy<Application>? =
            state.categoryTokens.isEmpty ? nil : .specific(state.categoryTokens)
        let categoriesMatch =
            settingsStore.shield.applicationCategories == expectedCategories

        return applicationsMatch && categoriesMatch && webDomainsMatch
    }
}

enum AppBlockerError: LocalizedError, Equatable {
    case notAuthorized
    case noSelection
    case selectionLocked
    case unsupportedExistingCategoryPolicy
    case verificationFailedRolledBack
    case commitFailedRolledBack
    case rollbackFailed
    case recoveryFailed

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Screen Time authorization has not been granted."
        case .noSelection:
            return "No apps, categories, or websites have been selected."
        case .selectionLocked:
            return "Unlock ScanLock before changing the blocked app selection."
        case .unsupportedExistingCategoryPolicy:
            return "The existing category shield configuration cannot be safely changed."
        case .verificationFailedRolledBack:
            return "The blocking change could not be verified, so the previous state was restored."
        case .commitFailedRolledBack:
            return "The blocking change could not be committed, so the previous state was restored."
        case .rollbackFailed:
            return "The blocking change and its rollback could not be verified. Reopen ScanLock to recover."
        case .recoveryFailed:
            return "ScanLock could not restore an interrupted blocking change."
        }
    }
}
