import FamilyControls
import Foundation

final class AppSelectionStore {
    static let shared = AppSelectionStore()

    private let selectionKey = "ScanLockFamilyActivitySelection"

    private init() {}

    func save(_ selection: FamilyActivitySelection) throws {
        let data = try JSONEncoder().encode(selection)
        UserDefaults.standard.set(data, forKey: selectionKey)
    }

    func load() -> FamilyActivitySelection {
        guard
            let data = UserDefaults.standard.data(forKey: selectionKey),
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
        UserDefaults.standard.removeObject(forKey: selectionKey)
    }
}
