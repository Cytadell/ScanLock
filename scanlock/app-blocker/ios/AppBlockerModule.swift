import ExpoModulesCore
import FamilyControls

public class AppBlockerModule: Module {

    public func definition() -> ModuleDefinition {
        Name("AppBlocker")

        AsyncFunction("requestAuthorization") {
            do {
                try await AuthorizationCenter.shared
                    .requestAuthorization(for: .individual)

                return AuthorizationCenter.shared
                    .authorizationStatus == .approved

            } catch {
                print(
                    "Screen Time authorization failed: \(error)"
                )

                return false
            }
        }


        AsyncFunction("selectApps") {
            guard
                AuthorizationCenter.shared.authorizationStatus == .approved
            else {
                throw AppBlockerModuleError.notAuthorized
            }

            try await MainActor.run {
                try AppPickerPresenter.shared.present()
            }
        }


        Function("isAuthorized") {
            AuthorizationCenter.shared
                .authorizationStatus == .approved
        }


        Function("getSelectedAppCount") {
            AppSelectionStore.shared
                .getSelectedAppCount()
        }


        Function("hasSelection") {
            AppSelectionStore.shared.hasSelection()
        }


        AsyncFunction("enableBlocking") {
            try AppBlocker.shared.enable()
        }


        AsyncFunction("disableBlocking") {
            AppBlocker.shared.disable()
        }


        AsyncFunction("clearSelection") {
            AppBlocker.shared.disable()
            AppSelectionStore.shared.clear()
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