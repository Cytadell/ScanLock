import ExpoModulesCore
import FamilyControls
import SwiftUI
import UIKit

final class SelectedActivityListView: ExpoView {
    private let hostingController: UIHostingController<SelectedActivityListContent>

    required init(appContext: AppContext? = nil) {
        hostingController = UIHostingController(
            rootView: SelectedActivityListContent(
                selection: AppSelectionStore.shared.load()
            )
        )

        super.init(appContext: appContext)

        backgroundColor = .clear
        hostingController.view.backgroundColor = .clear
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        addSubview(hostingController.view)

        NSLayoutConstraint.activate([
            hostingController.view.leadingAnchor.constraint(equalTo: leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: trailingAnchor),
            hostingController.view.topAnchor.constraint(equalTo: topAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    func reloadSelection() {
        hostingController.rootView = SelectedActivityListContent(
            selection: AppSelectionStore.shared.load()
        )
    }
}

private struct SelectedActivityListContent: View {
    let selection: FamilyActivitySelection

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(selection.applicationTokens), id: \.self) { token in
                    activityChip {
                        Label(token)
                    }
                }

                ForEach(Array(selection.categoryTokens), id: \.self) { token in
                    activityChip {
                        Label(token)
                    }
                }

                ForEach(Array(selection.webDomainTokens), id: \.self) { token in
                    activityChip {
                        Label(token)
                    }
                }
            }
            .padding(.horizontal, 1)
        }
    }

    private func activityChip<Content: View>(
        @ViewBuilder content: () -> Content
    ) -> some View {
        content()
            .font(.subheadline.weight(.semibold))
            .lineLimit(1)
            .padding(.horizontal, 11)
            .padding(.vertical, 9)
            .background(Color(red: 0.953, green: 0.941, blue: 1.0))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
