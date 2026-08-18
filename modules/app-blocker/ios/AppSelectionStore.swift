import FamilyControls
import Foundation

final class AppSelectionStore {
    static let shared = AppSelectionStore()

    private let defaults: UserDefaults
    private let selectionKey: String

    init(
        defaults: UserDefaults = .standard,
        selectionKey: String = "ScanLockFamilyActivitySelection"
    ) {
        self.defaults = defaults
        self.selectionKey = selectionKey
    }

    func save(_ selection: FamilyActivitySelection) throws {
        let data = try JSONEncoder().encode(selection)
        defaults.set(data, forKey: selectionKey)
    }

    func load() -> FamilyActivitySelection {
        guard
            let data = defaults.data(forKey: selectionKey),
            let selection = try? JSONDecoder().decode(
                FamilyActivitySelection.self,
                from: data
            )
        else {
            return FamilyActivitySelection()
        }

        return selection
    }

    func getSelectedItemCount() -> Int {
        let selection = load()
        return selection.applicationTokens.count
            + selection.categoryTokens.count
            + selection.webDomainTokens.count
    }

    func hasSelection() -> Bool {
        getSelectedItemCount() > 0
    }

    func clear() {
        defaults.removeObject(forKey: selectionKey)
    }
}
