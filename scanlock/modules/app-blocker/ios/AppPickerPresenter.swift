import FamilyControls
import SwiftUI
import UIKit

final class AppPickerPresenter {
    static let shared = AppPickerPresenter()

    private init() {}

    @MainActor
    func present() async throws -> [String: Int] {
        try await withCheckedThrowingContinuation { continuation in
            do {
                try presentPicker { selection in
                    continuation.resume(returning: [
                        "count": selection.applicationTokens.count
                            + selection.categoryTokens.count
                            + selection.webDomainTokens.count,
                        "applicationCount": selection.applicationTokens.count,
                        "categoryCount": selection.categoryTokens.count,
                        "webDomainCount": selection.webDomainTokens.count,
                    ])
                }
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }

    @MainActor
    private func presentPicker(
        onFinished: @escaping (FamilyActivitySelection) -> Void
    ) throws {
        guard
            let rootViewController = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow })?
                .rootViewController
        else {
            throw AppPickerError.noViewController
        }

        let presentingController = topViewController(from: rootViewController)
        var hostingController: UIHostingController<AppPickerView>!

        let pickerView = AppPickerView { selection in
            try? AppSelectionStore.shared.save(selection)
            hostingController.dismiss(animated: true) {
                onFinished(selection)
            }
        }

        hostingController = UIHostingController(rootView: pickerView)
        hostingController.modalPresentationStyle = .pageSheet
        hostingController.isModalInPresentation = true
        presentingController.present(hostingController, animated: true)
    }

    @MainActor
    private func topViewController(from controller: UIViewController) -> UIViewController {
        if let presented = controller.presentedViewController {
            return topViewController(from: presented)
        }
        if let navigation = controller as? UINavigationController,
           let visible = navigation.visibleViewController {
            return topViewController(from: visible)
        }
        if let tabs = controller as? UITabBarController,
           let selected = tabs.selectedViewController {
            return topViewController(from: selected)
        }
        return controller
    }
}

enum AppPickerError: LocalizedError {
    case noViewController

    var errorDescription: String? {
        "Could not find a view controller to present the app picker."
    }
}
