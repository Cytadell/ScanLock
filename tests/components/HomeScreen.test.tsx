import { fireEvent, render, screen } from "@testing-library/react-native";

import HomeScreen from "@/app/(tabs)/index";

const mockNavigate = jest.fn();
const mockDismissQrKeyReminder = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));
jest.mock("@/hooks/use-lock-scanner", () => ({
  useLockScanner: () => ({
    isLoading: false,
    isOpen: false,
    locked: false,
    hasSelectedApps: true,
    lockElapsed: "00:00:00",
    chooseAppsFirstVisible: false,
    isChoosingApps: false,
    qrKeyReminderVisible: true,
    isConfirmingQrKey: false,
    emergencyUnlockVisible: false,
    emergencyUnlockCountdown: 10,
    emergencyUnlockChanging: false,
    chooseAppsFromPrompt: jest.fn(),
    dismissChooseAppsFirst: jest.fn(),
    confirmQrKeyAndOpen: jest.fn(),
    dismissQrKeyReminder: mockDismissQrKeyReminder,
    requestEmergencyUnlock: jest.fn(),
    cancelEmergencyUnlock: jest.fn(),
    performEmergencyUnlock: jest.fn(),
    open: jest.fn(),
  }),
}));
jest.mock("@/components/emergency/EmergencyUnlockModal", () => ({
  EmergencyUnlockModal: () => null,
}));
jest.mock("@/components/scanner/ChooseAppsFirstModal", () => ({
  ChooseAppsFirstModal: () => null,
}));
jest.mock("@/components/scanner/LockStatusCard", () => ({
  LockStatusCard: () => null,
}));
jest.mock("@/components/scanner/QrKeyReminderModal", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    QrKeyReminderModal: ({ onGetLock }: { onGetLock: () => void }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: "button", onPress: onGetLock },
        React.createElement(Text, null, "Get Lock")
      ),
  };
});

describe("HomeScreen QR key reminder", () => {
  it("dismisses the reminder and navigates to Get Lock", async () => {
    await render(<HomeScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Get Lock" }));

    expect(mockDismissQrKeyReminder).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(tabs)/getlock");
  });
});
