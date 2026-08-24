import ExpoModulesCore
import FamilyControls

public final class AppBlockerModule: Module {
    public func definition() -> ModuleDefinition {
        Name("AppBlocker")

        Constant("supportsSelectedActivityList") {
            true
        }

        View(SelectedActivityListView.self) {
            ViewName("SelectedActivityList")

            Prop("refreshKey") { (view: SelectedActivityListView, _: Int) in
                view.reloadSelection()
            }
        }

        AsyncFunction("requestAuthorization") {
            await requestFamilyControlsAuthorization()
        }

        AsyncFunction("selectApps") {
            try await presentAppPicker()
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

@MainActor
private func requestFamilyControlsAuthorization() async -> Bool {
    do {
        try await AuthorizationCenter.shared
            .requestAuthorization(for: .individual)
        return true
    } catch {
        return false
    }
}

@MainActor
private func presentAppPicker() async throws -> [String: Int] {
    guard AuthorizationCenter.shared.authorizationStatus == .approved else {
        throw AppBlockerModuleError.notAuthorized
    }

    guard try AppBlocker.shared.getLocked() == false else {
        throw AppBlockerError.selectionLocked
    }

    return try await AppPickerPresenter.shared.present()
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
