import UIKit
import SwiftUI

final class AppPickerPresenter {

    static let shared = AppPickerPresenter()

    private init() {}

    @MainActor
    func present() throws {
        guard
            let rootViewController = UIApplication.shared
                .connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: { $0.isKeyWindow })?
                .rootViewController
        else {
            throw AppPickerError.noViewController
        }

        let presentingController =
            topViewController(from: rootViewController)

        var hostingController: UIHostingController<AppPickerView>!

        let pickerView = AppPickerView {
            hostingController.dismiss(animated: true)
        }

        hostingController = UIHostingController(
            rootView: pickerView
        )

        hostingController.modalPresentationStyle = .pageSheet

        presentingController.present(
            hostingController,
            animated: true
        )
    }

    private func topViewController(
        from controller: UIViewController
    ) -> UIViewController {

        if let presented = controller.presentedViewController {
            return topViewController(from: presented)
        }

        if let nav = controller as? UINavigationController,
           let visible = nav.visibleViewController {
            return topViewController(from: visible)
        }

        if let tab = controller as? UITabBarController,
           let selected = tab.selectedViewController {
            return topViewController(from: selected)
        }

        return controller
    }
}

enum AppPickerError: LocalizedError {
    case noViewController

    var errorDescription: String? {
        switch self {
        case .noViewController:
            return "Could not find a view controller to present the app picker."
        }
    }
}