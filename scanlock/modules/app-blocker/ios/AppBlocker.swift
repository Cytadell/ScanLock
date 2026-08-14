import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings

final class AppBlocker {
    static let shared = AppBlocker()

    private let settingsStore = ManagedSettingsStore()
    private let operationLock = NSLock()
    private let journalStore = BlockingOperationJournalStore()

    private init() {
        operationLock.lock()
        defer { operationLock.unlock() }
        try? recoverInterruptedOperation()
    }

    func getLocked() throws -> Bool {
        operationLock.lock()
        defer { operationLock.unlock() }

        try recoverInterruptedOperation()
        return hasAnyShield
    }

    func saveSelection(_ selection: FamilyActivitySelection) throws {
        operationLock.lock()
        defer { operationLock.unlock() }

        try recoverInterruptedOperation()
        guard !hasAnyShield else {
            throw AppBlockerError.selectionLocked
        }
        try AppSelectionStore.shared.save(selection)
    }

    func setBlockingEnabled(_ enabled: Bool) throws -> BlockingResult {
        operationLock.lock()
        defer { operationLock.unlock() }

        return try setBlockingEnabledLocked(enabled)
    }

    func clearSelection() throws {
        operationLock.lock()
        defer { operationLock.unlock() }

        _ = try setBlockingEnabledLocked(false)
        AppSelectionStore.shared.clear()
    }

    private func setBlockingEnabledLocked(_ enabled: Bool) throws -> BlockingResult {
        do {
            try recoverInterruptedOperation()
        } catch {
            guard !enabled else { throw error }

            // Unlock is the last-resort recovery path. If the journal itself is
            // unreadable, clearing every shield is safer than trapping the user.
            apply(.empty)
            guard shieldMatches(.empty) else {
                throw AppBlockerError.recoveryFailed
            }
            try journalStore.clear()
            return blockingResult(for: .empty)
        }

        if enabled {
            guard AuthorizationCenter.shared.authorizationStatus == .approved else {
                throw AppBlockerError.notAuthorized
            }
        }

        let previous = try captureShieldState()
        let intended: ShieldState

        if enabled {
            let selection = AppSelectionStore.shared.load()
            guard
                !selection.applicationTokens.isEmpty ||
                !selection.categoryTokens.isEmpty ||
                !selection.webDomainTokens.isEmpty
            else {
                throw AppBlockerError.noSelection
            }
            intended = ShieldState(selection: selection)
        } else {
            intended = .empty
        }

        if shieldMatches(intended) {
            return blockingResult(for: intended)
        }

        try journalStore.save(
            BlockingOperationJournal(previous: previous, intended: intended)
        )

        apply(intended)

        guard shieldMatches(intended) else {
            try rollback(to: previous, because: .verificationFailedRolledBack)
        }

        do {
            try journalStore.clear()
        } catch {
            try rollback(to: previous, because: .commitFailedRolledBack)
        }
        return blockingResult(for: intended)
    }

    private var hasAnyShield: Bool {
        settingsStore.shield.applications != nil ||
            settingsStore.shield.applicationCategories != nil ||
            settingsStore.shield.webDomains != nil
    }

    private func recoverInterruptedOperation() throws {
        guard let journal = try journalStore.load() else { return }

        apply(journal.previous)
        guard shieldMatches(journal.previous) else {
            throw AppBlockerError.recoveryFailed
        }
        try journalStore.clear()
    }

    private func captureShieldState() throws -> ShieldState {
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

    private func apply(_ state: ShieldState) {
        settingsStore.shield.applications =
            state.applicationTokens.isEmpty ? nil : state.applicationTokens
        settingsStore.shield.applicationCategories =
            state.categoryTokens.isEmpty ? nil : .specific(state.categoryTokens)
        settingsStore.shield.webDomains =
            state.webDomainTokens.isEmpty ? nil : state.webDomainTokens
    }

    private func rollback(
        to previous: ShieldState,
        because failure: AppBlockerError
    ) throws -> Never {
        apply(previous)
        guard shieldMatches(previous) else {
            throw AppBlockerError.rollbackFailed
        }
        do {
            try journalStore.clear()
        } catch {
            throw AppBlockerError.rollbackFailed
        }
        throw failure
    }

    private func shieldMatches(_ state: ShieldState) -> Bool {
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

    private func blockingResult(for state: ShieldState) -> BlockingResult {
        BlockingResult(
            status: state.isEmpty ? "unlocked" : "locked",
            locked: !state.isEmpty
        )
    }
}

struct BlockingResult: Record {
    @Field var status: String = "unlocked"
    @Field var locked: Bool = false
}

private struct ShieldState: Codable {
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

private struct BlockingOperationJournal: Codable {
    let previous: ShieldState
    let intended: ShieldState
}

private final class BlockingOperationJournalStore {
    private let fileURL: URL

    init() {
        let applicationSupport = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        )[0]
        let directory = applicationSupport.appendingPathComponent("ScanLock", isDirectory: true)
        fileURL = directory.appendingPathComponent("blocking-operation.json")
    }

    func save(_ journal: BlockingOperationJournal) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let data = try JSONEncoder().encode(journal)
        try data.write(to: fileURL, options: .atomic)
    }

    func load() throws -> BlockingOperationJournal? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        return try JSONDecoder().decode(
            BlockingOperationJournal.self,
            from: Data(contentsOf: fileURL)
        )
    }

    func clear() throws {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return }
        try FileManager.default.removeItem(at: fileURL)
    }
}

enum AppBlockerError: LocalizedError {
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
