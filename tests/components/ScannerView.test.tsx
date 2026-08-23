import { render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { ScannerView } from "@/components/scanner/ScannerView";

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native/Libraries/Utilities/warnOnce", () => ({
  __esModule: true,
  default: () => undefined,
}));
jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 59, right: 0, bottom: 34, left: 0 }),
  };
});
jest.mock("expo-camera", () => {
  const { View } = require("react-native");
  return { CameraView: (props: object) => <View {...props} testID="camera-view" /> };
});

const defaultProps = {
  locked: false,
  torchEnabled: false,
  errorMessage: undefined,
  onBarcodeScanned: jest.fn(),
  onToggleTorch: jest.fn(),
  onRetry: jest.fn(),
  onClose: jest.fn(),
};

describe("ScannerView accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
  });

  it("exposes scanner controls with roles and state", async () => {
    await render(<ScannerView {...defaultProps} status="scanning" />);

    expect(screen.getByRole("button", { name: "Close scanner" })).toBeOnTheScreen();
    expect(screen.getByRole("switch", { name: "Flashlight" })).toHaveProp("accessibilityState", { checked: false });
    expect(screen.getByTestId("camera-view", { includeHiddenElements: true })).toHaveProp(
      "importantForAccessibility",
      "no-hide-descendants"
    );
  });

  it("shows printing guidance while scanning to lock", async () => {
    await render(<ScannerView {...defaultProps} status="scanning" />);

    expect(screen.getByText(/Haven’t printed your QR code/)).toBeOnTheScreen();
    expect(screen.queryByText(/Lost your QR code/)).not.toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      expect.stringContaining("Print or save it from the Get Lock tab")
    );
  });

  it("shows Emergency Unlock guidance while scanning to unlock", async () => {
    await render(<ScannerView {...defaultProps} status="scanning" locked />);

    expect(screen.getByText(/Lost your QR code/)).toBeOnTheScreen();
    expect(screen.queryByText(/Haven’t printed your QR code/)).not.toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      expect.stringContaining("use Emergency Unlock on the Home screen")
    );
  });

  it("announces success and exposes retry after an invalid code", async () => {
    const view = await render(<ScannerView {...defaultProps} status="success" locked />);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith("Apps locked.");

    await view.rerender(<ScannerView {...defaultProps} status="invalid-code" />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeOnTheScreen();
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      "That is not your ScanLock QR code. Try again."
    );
  });

  it("exposes the Settings recovery action when camera access is denied", async () => {
    await render(<ScannerView {...defaultProps} status="permission-denied" />);
    expect(screen.getByRole("button", { name: "Open Settings" })).toBeOnTheScreen();
  });
});
