import XCTest
@testable import AppBlocker

final class BlockingStateMachineTests: XCTestCase {
    private let selected = TestShieldState(values: ["app", "category", "website"])

    func testLockRequiresAuthorizationBeforeReadingSelection() {
        let shields = FakeShieldManager()
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal, authorized: false)
        var selectionWasRead = false

        assertAppBlockerError(.notAuthorized) {
            _ = try machine.setBlockingEnabled(true) {
                selectionWasRead = true
                return self.selected
            }
        }

        XCTAssertFalse(selectionWasRead)
        XCTAssertTrue(shields.state.isEmpty)
        XCTAssertTrue(journal.savedJournals.isEmpty)
    }

    func testLockRejectsAnEmptySelectionWithoutChangingShields() {
        let previous = TestShieldState(values: ["existing"])
        let shields = FakeShieldManager(state: previous)
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal)

        assertAppBlockerError(.noSelection) {
            _ = try machine.setBlockingEnabled(true) { .empty }
        }

        XCTAssertEqual(shields.state, previous)
        XCTAssertTrue(journal.savedJournals.isEmpty)
    }

    func testSuccessfulLockJournalsAppliesVerifiesAndCommits() throws {
        let previous = TestShieldState(values: ["old"])
        let shields = FakeShieldManager(state: previous)
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal)

        let result = try machine.setBlockingEnabled(true) { selected }

        XCTAssertEqual(result, selected)
        XCTAssertEqual(shields.state, selected)
        XCTAssertEqual(
            journal.savedJournals,
            [BlockingOperationJournal(previous: previous, intended: selected)]
        )
        XCTAssertEqual(journal.clearCallCount, 1)
        XCTAssertNil(journal.journal)
    }

    func testLockIsIdempotentWhenTheIntendedShieldsAlreadyMatch() throws {
        let shields = FakeShieldManager(state: selected)
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal)

        let result = try machine.setBlockingEnabled(true) { selected }

        XCTAssertEqual(result, selected)
        XCTAssertTrue(journal.savedJournals.isEmpty)
        XCTAssertEqual(journal.clearCallCount, 0)
    }

    func testUnlockDoesNotRequireAuthorizationOrReadSelection() throws {
        let shields = FakeShieldManager(state: selected)
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal, authorized: false)
        var selectionWasRead = false

        let result = try machine.setBlockingEnabled(false) {
            selectionWasRead = true
            return self.selected
        }

        XCTAssertEqual(result, .empty)
        XCTAssertTrue(shields.state.isEmpty)
        XCTAssertFalse(selectionWasRead)
    }

    func testUnlockIsIdempotent() throws {
        let shields = FakeShieldManager()
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal, authorized: false)

        let result = try machine.setBlockingEnabled(false) { selected }

        XCTAssertEqual(result, .empty)
        XCTAssertTrue(journal.savedJournals.isEmpty)
    }

    func testVerificationFailureRollsBackAndClearsJournal() {
        let previous = TestShieldState(values: ["old"])
        let shields = FakeShieldManager(state: previous)
        // Not already applied, intended state fails verification, rollback verifies.
        shields.matchResults = [false, false, true]
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal)

        assertAppBlockerError(.verificationFailedRolledBack) {
            _ = try machine.setBlockingEnabled(true) { self.selected }
        }

        XCTAssertEqual(shields.state, previous)
        XCTAssertNil(journal.journal)
    }

    func testCommitFailureRollsBackAndReportsCommitFailure() {
        let previous = TestShieldState(values: ["old"])
        let shields = FakeShieldManager(state: previous)
        let journal = FakeJournalStore()
        journal.clearFailuresRemaining = 1
        let machine = makeMachine(shields: shields, journal: journal)

        assertAppBlockerError(.commitFailedRolledBack) {
            _ = try machine.setBlockingEnabled(true) { self.selected }
        }

        XCTAssertEqual(shields.state, previous)
        XCTAssertEqual(journal.clearCallCount, 2)
        XCTAssertNil(journal.journal)
    }

    func testRollbackVerificationFailureReportsRollbackFailure() {
        let shields = FakeShieldManager(state: TestShieldState(values: ["old"]))
        // Not already applied, intended state fails verification, rollback also fails.
        shields.matchResults = [false, false, false]
        let journal = FakeJournalStore()
        let machine = makeMachine(shields: shields, journal: journal)

        assertAppBlockerError(.rollbackFailed) {
            _ = try machine.setBlockingEnabled(true) { self.selected }
        }
    }

    func testRecoveryRestoresPreviousStateAndClearsJournal() throws {
        let previous = TestShieldState(values: ["old"])
        let intended = TestShieldState(values: ["new"])
        let shields = FakeShieldManager(state: intended)
        let journal = FakeJournalStore()
        journal.journal = BlockingOperationJournal(previous: previous, intended: intended)
        let machine = makeMachine(shields: shields, journal: journal)

        try machine.recoverInterruptedOperation()

        XCTAssertEqual(shields.state, previous)
        XCTAssertNil(journal.journal)
    }

    func testRecoveryVerificationFailurePreservesJournal() {
        let previous = TestShieldState(values: ["old"])
        let shields = FakeShieldManager(state: selected)
        shields.matchResults = [false]
        let journal = FakeJournalStore()
        journal.journal = BlockingOperationJournal(previous: previous, intended: selected)
        let machine = makeMachine(shields: shields, journal: journal)

        assertAppBlockerError(.recoveryFailed) {
            try machine.recoverInterruptedOperation()
        }

        XCTAssertNotNil(journal.journal)
    }

    func testUnreadableJournalStopsLocking() {
        let shields = FakeShieldManager()
        let journal = FakeJournalStore()
        journal.loadError = TestFailure.injected
        let machine = makeMachine(shields: shields, journal: journal)

        XCTAssertThrowsError(try machine.setBlockingEnabled(true) { self.selected })
        XCTAssertTrue(shields.state.isEmpty)
    }

    func testUnreadableJournalStillAllowsEmergencyUnlock() throws {
        let shields = FakeShieldManager(state: selected)
        let journal = FakeJournalStore()
        journal.loadError = TestFailure.injected
        let machine = makeMachine(shields: shields, journal: journal, authorized: false)

        let result = try machine.setBlockingEnabled(false) { selected }

        XCTAssertEqual(result, .empty)
        XCTAssertTrue(shields.state.isEmpty)
        XCTAssertEqual(journal.clearCallCount, 1)
    }

    func testEmergencyUnlockReportsRecoveryFailureWhenClearingCannotBeVerified() {
        let shields = FakeShieldManager(state: selected)
        shields.matchResults = [false]
        let journal = FakeJournalStore()
        journal.loadError = TestFailure.injected
        let machine = makeMachine(shields: shields, journal: journal, authorized: false)

        assertAppBlockerError(.recoveryFailed) {
            _ = try machine.setBlockingEnabled(false) { self.selected }
        }
    }

    private func makeMachine(
        shields: FakeShieldManager,
        journal: FakeJournalStore,
        authorized: Bool = true
    ) -> BlockingStateMachine<FakeShieldManager, FakeJournalStore> {
        BlockingStateMachine(
            shields: shields,
            journalStore: journal,
            isAuthorized: { authorized }
        )
    }
}
