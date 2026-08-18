import Foundation

protocol BlockingStateValue: Codable, Equatable {
    static var empty: Self { get }
    var isEmpty: Bool { get }
}

struct BlockingOperationJournal<State: BlockingStateValue>: Codable, Equatable {
    let previous: State
    let intended: State
}

protocol BlockingShieldManaging {
    associatedtype State: BlockingStateValue

    var hasAnyShield: Bool { get }
    func capture() throws -> State
    func apply(_ state: State)
    func matches(_ state: State) -> Bool
}

protocol BlockingJournalStoring {
    associatedtype State: BlockingStateValue

    func save(_ journal: BlockingOperationJournal<State>) throws
    func load() throws -> BlockingOperationJournal<State>?
    func clear() throws
}

final class BlockingStateMachine<Shields, JournalStore>
where
    Shields: BlockingShieldManaging,
    JournalStore: BlockingJournalStoring,
    Shields.State == JournalStore.State
{
    typealias State = Shields.State

    private let shields: Shields
    private let journalStore: JournalStore
    private let isAuthorized: () -> Bool

    init(
        shields: Shields,
        journalStore: JournalStore,
        isAuthorized: @escaping () -> Bool
    ) {
        self.shields = shields
        self.journalStore = journalStore
        self.isAuthorized = isAuthorized
    }

    var hasAnyShield: Bool {
        shields.hasAnyShield
    }

    func recoverInterruptedOperation() throws {
        guard let journal = try journalStore.load() else { return }

        shields.apply(journal.previous)
        guard shields.matches(journal.previous) else {
            throw AppBlockerError.recoveryFailed
        }
        try journalStore.clear()
    }

    func setBlockingEnabled(
        _ enabled: Bool,
        intendedState: () throws -> State
    ) throws -> State {
        do {
            try recoverInterruptedOperation()
        } catch {
            guard !enabled else { throw error }

            // Unlock is the last-resort recovery path. If the journal itself is
            // unreadable, clearing every shield is safer than trapping the user.
            shields.apply(.empty)
            guard shields.matches(.empty) else {
                throw AppBlockerError.recoveryFailed
            }
            do {
                try journalStore.clear()
            } catch {
                throw AppBlockerError.recoveryFailed
            }
            return .empty
        }

        if enabled && !isAuthorized() {
            throw AppBlockerError.notAuthorized
        }

        let previous = try shields.capture()
        let intended: State
        if enabled {
            intended = try intendedState()
        } else {
            intended = .empty
        }

        if enabled && intended.isEmpty {
            throw AppBlockerError.noSelection
        }

        if shields.matches(intended) {
            return intended
        }

        try journalStore.save(
            BlockingOperationJournal(previous: previous, intended: intended)
        )

        shields.apply(intended)

        guard shields.matches(intended) else {
            try rollback(to: previous, because: .verificationFailedRolledBack)
        }

        do {
            try journalStore.clear()
        } catch {
            try rollback(to: previous, because: .commitFailedRolledBack)
        }
        return intended
    }

    private func rollback(
        to previous: State,
        because failure: AppBlockerError
    ) throws -> Never {
        shields.apply(previous)
        guard shields.matches(previous) else {
            throw AppBlockerError.rollbackFailed
        }
        do {
            try journalStore.clear()
        } catch {
            throw AppBlockerError.rollbackFailed
        }
        throw failure
    }
}

final class FileBlockingOperationJournalStore<State: BlockingStateValue>:
    BlockingJournalStoring
{
    private let fileURL: URL

    init(fileURL: URL) {
        self.fileURL = fileURL
    }

    func save(_ journal: BlockingOperationJournal<State>) throws {
        let directory = fileURL.deletingLastPathComponent()
        try FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        let data = try JSONEncoder().encode(journal)
        try data.write(to: fileURL, options: .atomic)
    }

    func load() throws -> BlockingOperationJournal<State>? {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        return try JSONDecoder().decode(
            BlockingOperationJournal<State>.self,
            from: Data(contentsOf: fileURL)
        )
    }

    func clear() throws {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return }
        try FileManager.default.removeItem(at: fileURL)
    }
}
