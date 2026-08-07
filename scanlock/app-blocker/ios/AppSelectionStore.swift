import Foundation
import FamilyControls

final class AppSelectionStore {
    static let shared = AppSelectionStore()

    private let selectionKey = "ScanLockBrickFamilyActivitySelection"

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

    func getSelectedAppCount() -> Int {
        load().applicationTokens.count
    }

    func hasSelection() -> Bool {
        let selection = load()

        return !selection.applicationTokens.isEmpty ||
               !selection.categoryTokens.isEmpty ||
               !selection.webDomainTokens.isEmpty
    }

    func clear() {
        UserDefaults.standard.removeObject(forKey: selectionKey)
    }
}