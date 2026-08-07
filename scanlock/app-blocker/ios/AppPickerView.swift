import SwiftUI
import FamilyControls

struct AppPickerView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var selection: FamilyActivitySelection
    @State private var pickerPresented = true

    let onFinished: () -> Void

    init(onFinished: @escaping () -> Void) {
        self.onFinished = onFinished

        _selection = State(
            initialValue: AppSelectionStore.shared.load()
        )
    }

    var body: some View {
        Color.clear
            .familyActivityPicker(
                title: "Select Apps",
                headerText: "Choose the apps you want Scan Lock to block.",
                footerText: "You can change this selection later.",
                isPresented: $pickerPresented,
                selection: $selection
            )
            .onChange(of: selection) { newSelection in
                do {
                    try AppSelectionStore.shared.save(newSelection)
                } catch {
                    print("Could not save app selection: \(error)")
                }
            }
            .onChange(of: pickerPresented) { isPresented in
                if !isPresented {
                    onFinished()
                    dismiss()
                }
            }
    }
}