import FamilyControls
import SwiftUI

struct AppPickerView: View {
    @State private var selection: FamilyActivitySelection
    @State private var pickerPresented = true

    let onFinished: (FamilyActivitySelection) -> Void

    init(onFinished: @escaping (FamilyActivitySelection) -> Void) {
        self.onFinished = onFinished
        _selection = State(initialValue: AppSelectionStore.shared.load())
    }

    var body: some View {
        Color.clear
            .familyActivityPicker(
                headerText: "Choose the apps you want ScanLock to block.",
                footerText: "You can change this selection later.",
                isPresented: $pickerPresented,
                selection: $selection
            )
            .onChange(of: selection) { newSelection in
                try? AppSelectionStore.shared.save(newSelection)
            }
            .onChange(of: pickerPresented) { isPresented in
                guard !isPresented else { return }
                onFinished(selection)
            }
    }
}
