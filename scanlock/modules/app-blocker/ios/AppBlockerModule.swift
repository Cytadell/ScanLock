import ExpoModulesCore
import FamilyControls

public final class AppBlockerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("AppBlocker")

        AsyncFunction("requestAuthorization") {
            do {
                try await AuthorizationCenter.shared
                    .requestAuthorization(for: .individual)

                return AuthorizationCenter.shared.authorizationStatus == .approved
            } catch {
                return false
            }
        }

        AsyncFunction("selectApps") {
            guard AuthorizationCenter.shared.authorizationStatus == .approved else {
                throw AppBlockerModuleError.notAuthorized
            }

            guard try AppBlocker.shared.getLocked() == false else {
                throw AppBlockerError.selectionLocked
            }

            return try await AppPickerPresenter.shared.present()
        }

        Function("isAuthorized") {
            AuthorizationCenter.shared.authorizationStatus == .approved
        }

        Function("getSelectedAppCount") {
            AppSelectionStore.shared.getSelectedItemCount()
        }

        Function("hasSelection") {
            AppSelectionStore.shared.hasSelection()
        }

        Function("getLocked") {
            try AppBlocker.shared.getLocked()
        }

        AsyncFunction("setBlockingEnabled") { (enabled: Bool) in
            try AppBlocker.shared.setBlockingEnabled(enabled)
        }

        AsyncFunction("clearSelection") {
            try AppBlocker.shared.clearSelection()
        }
    }
}

enum AppBlockerModuleError: LocalizedError {
    case notAuthorized

    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Screen Time authorization is required before selecting apps."
        }
    }
}
