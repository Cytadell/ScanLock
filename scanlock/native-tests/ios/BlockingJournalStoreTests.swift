import XCTest
@testable import AppBlocker

final class BlockingJournalStoreTests: XCTestCase {
    private var temporaryDirectory: URL!
    private var fileURL: URL!

    override func setUpWithError() throws {
        temporaryDirectory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        fileURL = temporaryDirectory.appendingPathComponent("journal.json")
    }

    override func tearDownWithError() throws {
        if FileManager.default.fileExists(atPath: temporaryDirectory.path) {
            try FileManager.default.removeItem(at: temporaryDirectory)
        }
    }

    func testMissingJournalLoadsNilAndClearIsIdempotent() throws {
        let store = makeStore()

        XCTAssertNil(try store.load())
        XCTAssertNoThrow(try store.clear())
    }

    func testJournalRoundTripsAndCanBeCleared() throws {
        let store = makeStore()
        let journal = BlockingOperationJournal(
            previous: TestShieldState(values: ["old"]),
            intended: TestShieldState(values: ["new"])
        )

        try store.save(journal)

        XCTAssertEqual(try store.load(), journal)
        try store.clear()
        XCTAssertNil(try store.load())
    }

    func testSecondSaveAtomicallyReplacesFirstJournal() throws {
        let store = makeStore()
        let first = BlockingOperationJournal(
            previous: TestShieldState.empty,
            intended: TestShieldState(values: ["first"])
        )
        let second = BlockingOperationJournal(
            previous: TestShieldState(values: ["first"]),
            intended: TestShieldState(values: ["second"])
        )

        try store.save(first)
        try store.save(second)

        XCTAssertEqual(try store.load(), second)
    }

    func testCorruptJournalThrowsInsteadOfBeingTreatedAsMissing() throws {
        try FileManager.default.createDirectory(
            at: temporaryDirectory,
            withIntermediateDirectories: true
        )
        try Data("not json".utf8).write(to: fileURL)

        XCTAssertThrowsError(try makeStore().load())
    }

    private func makeStore() -> FileBlockingOperationJournalStore<TestShieldState> {
        FileBlockingOperationJournalStore(fileURL: fileURL)
    }
}
