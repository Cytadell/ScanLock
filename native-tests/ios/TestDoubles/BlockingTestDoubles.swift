import Foundation
import XCTest
@testable import AppBlocker

struct TestShieldState: BlockingStateValue {
    let values: Set<String>

    static let empty = TestShieldState(values: [])

    var isEmpty: Bool {
        values.isEmpty
    }
}

enum TestFailure: Error {
    case injected
}

final class FakeShieldManager: BlockingShieldManaging {
    private(set) var state: TestShieldState
    private(set) var events: [String] = []
    var captureError: Error?
    var matchResults: [Bool] = []

    init(state: TestShieldState = .empty) {
        self.state = state
    }

    var hasAnyShield: Bool {
        !state.isEmpty
    }

    func capture() throws -> TestShieldState {
        events.append("capture")
        if let captureError { throw captureError }
        return state
    }

    func apply(_ state: TestShieldState) {
        events.append("apply:\(state.values.sorted().joined(separator: ","))")
        self.state = state
    }

    func matches(_ state: TestShieldState) -> Bool {
        events.append("matches:\(state.values.sorted().joined(separator: ","))")
        if !matchResults.isEmpty {
            return matchResults.removeFirst()
        }
        return self.state == state
    }
}

final class FakeJournalStore: BlockingJournalStoring {
    typealias State = TestShieldState

    var journal: BlockingOperationJournal<TestShieldState>?
    var loadError: Error?
    var saveError: Error?
    var clearFailuresRemaining = 0
    private(set) var savedJournals: [BlockingOperationJournal<TestShieldState>] = []
    private(set) var clearCallCount = 0

    func save(_ journal: BlockingOperationJournal<TestShieldState>) throws {
        if let saveError { throw saveError }
        savedJournals.append(journal)
        self.journal = journal
    }

    func load() throws -> BlockingOperationJournal<TestShieldState>? {
        if let loadError { throw loadError }
        return journal
    }

    func clear() throws {
        clearCallCount += 1
        if clearFailuresRemaining > 0 {
            clearFailuresRemaining -= 1
            throw TestFailure.injected
        }
        journal = nil
    }
}

func assertAppBlockerError(
    _ expected: AppBlockerError,
    from operation: () throws -> Void,
    file: StaticString = #filePath,
    line: UInt = #line
) {
    do {
        try operation()
        XCTFail("Expected \(expected)", file: file, line: line)
    } catch let error as AppBlockerError {
        XCTAssertEqual(error, expected, file: file, line: line)
    } catch {
        XCTFail("Unexpected error: \(error)", file: file, line: line)
    }
}
