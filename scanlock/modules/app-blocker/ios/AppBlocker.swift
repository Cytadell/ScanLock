import FamilyControls
import Foundation
import ManagedSettings

final class AppBlocker {
    static let shared = AppBlocker()

    private let settingsStore = ManagedSettingsStore()

    private init() {}

    var isLocked: Bool {
        settingsStore.shield.applications != nil ||
            settingsStore.shield.applicationCategories != nil ||
            settingsStore.shield.webDomains != nil
    }

    func enable() throws {
        guard AuthorizationCenter.shared.authorizationStatus == .approved else {
            throw AppBlockerError.notAuthorized
        }

        let selection = AppSelectionStore.shared.load()

        guard
            !selection.applicationTokens.isEmpty ||
            !selection.categoryTokens.isEmpty ||
            !selection.webDomainTokens.isEmpty
        else {
            throw AppBlockerError.noSelection
        }

        settingsStore.shield.applications =
            selection.applicationTokens.isEmpty ? nil : selection.applicationTokens

        settingsStore.shield.applicationCategories =
            selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)

        settingsStore.shield.webDomains =
            selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
    }

    func disable() {
        settingsStore.clearAllSettings()
    }
}

enum AppBlockerError: LocalizedError {
    case notAuthorized
    case noSelection

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Screen Time authorization has not been granted."
        case .noSelection:
            return "No apps, categories, or websites have been selected."
        }
    }
}
