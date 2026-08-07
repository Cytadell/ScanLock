import Foundation
import FamilyControls
import ManagedSettings

final class AppBlocker {
    static let shared = AppBlocker()

    private let settingsStore = ManagedSettingsStore()

    private init() {}

    func enable() throws {
        guard
            AuthorizationCenter.shared.authorizationStatus == .approved
        else {
            throw AppBlockerError.notAuthorized
        }

        let selection = AppSelectionStore.shared.load()

        guard
            !selection.applicationTokens.isEmpty ||
            !selection.categoryTokens.isEmpty
        else {
            throw AppBlockerError.noAppsSelected
        }

        settingsStore.shield.applications =
            selection.applicationTokens.isEmpty
                ? nil
                : selection.applicationTokens

        settingsStore.shield.applicationCategories =
            selection.categoryTokens.isEmpty
                ? nil
                : .specific(selection.categoryTokens)

        settingsStore.shield.webDomains =
            selection.webDomainTokens.isEmpty
                ? nil
                : selection.webDomainTokens
    }

    func disable() {
        settingsStore.clearAllSettings()
    }
}

enum AppBlockerError: LocalizedError {
    case notAuthorized
    case noAppsSelected

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Screen Time authorization has not been granted."

        case .noAppsSelected:
            return "No apps have been selected."
        }
    }
}