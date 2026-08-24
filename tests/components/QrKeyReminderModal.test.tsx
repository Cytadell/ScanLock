import { fireEvent, render, screen } from "@testing-library/react-native";

import { QrKeyReminderModal } from "@/components/scanner/QrKeyReminderModal";

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("@/hooks/use-reduce-motion", () => ({
  useReduceMotion: () => true,
}));

describe("QrKeyReminderModal", () => {
  it("explains the QR requirement and exposes both actions", async () => {
    const onGetLock = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <QrKeyReminderModal
        visible
        confirming={false}
        onGetLock={onGetLock}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByRole("header", { name: "Have your QR key ready?" })).toBeOnTheScreen();
    expect(screen.getByText("You’ll need a printed copy of your ScanLock QR key to unlock your apps again. Print it before starting your focus session.")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Get Lock" }));
    await fireEvent.press(screen.getByRole("button", { name: "I already have it" }));

    expect(onGetLock).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("dismisses from the close button and Android back", async () => {
    const onDismiss = jest.fn();
    await render(
      <QrKeyReminderModal
        visible
        confirming={false}
        onGetLock={jest.fn()}
        onConfirm={jest.fn()}
        onDismiss={onDismiss}
      />
    );

    await fireEvent.press(screen.getByRole("button", { name: "Close QR key reminder" }));
    await fireEvent(screen.getByTestId("qr-key-reminder-modal"), "requestClose");

    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it("disables every action while confirmation is in progress", async () => {
    await render(
      <QrKeyReminderModal
        visible
        confirming
        onGetLock={jest.fn()}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Close QR key reminder" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Get Lock" })).toBeDisabled();
  });
});
