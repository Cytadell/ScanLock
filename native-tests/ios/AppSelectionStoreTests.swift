import FamilyControls
import XCTest
@testable import AppBlocker

final class AppSelectionStoreTests: XCTestCase {
    private var suiteName: String!
    private var defaults: UserDefaults!
    private var store: AppSelectionStore!

    override func setUp() {
        super.setUp()
        suiteName = "AppSelectionStoreTests.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suiteName)
        defaults.removePersistentDomain(forName: suiteName)
        store = AppSelectionStore(defaults: defaults, selectionKey: "selection")
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suiteName)
        store = nil
        defaults = nil
        suiteName = nil
        super.tearDown()
    }

    func testMissingSelectionLoadsEmpty() {
        XCTAssertEqual(store.getSelectedItemCount(), 0)
        XCTAssertFalse(store.hasSelection())
    }

    func testEmptySelectionRoundTrips() throws {
        try store.save(FamilyActivitySelection())

        XCTAssertEqual(store.getSelectedItemCount(), 0)
        XCTAssertFalse(store.hasSelection())
        XCTAssertNotNil(defaults.data(forKey: "selection"))
    }

    func testCorruptSelectionSafelyLoadsEmpty() {
        defaults.set(Data("not json".utf8), forKey: "selection")

        XCTAssertEqual(store.getSelectedItemCount(), 0)
        XCTAssertFalse(store.hasSelection())
    }

    func testClearRemovesPersistedSelection() throws {
        try store.save(FamilyActivitySelection())

        store.clear()

        XCTAssertNil(defaults.data(forKey: "selection"))
    }
}
