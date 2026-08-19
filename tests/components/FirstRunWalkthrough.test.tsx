import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import { FirstRunWalkthrough } from "@/components/onboarding/FirstRunWalkthrough";

const mockRequestAuthorization = jest.fn(async () => true);
const mockSelectApps = jest.fn(async () => ({ count: 1 }));

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("react-native/Libraries/Utilities/warnOnce", () => ({
  __esModule: true,
  default: () => undefined,
}));
jest.mock("@/services/appBlocker", () => ({
  requestAuthorization: () => mockRequestAuthorization(),
  selectApps: () => mockSelectApps(),
}));
jest.mock("@/services/qrCode", () => ({
  getOrCreateQrPayload: jest.fn(async () => "scanlock:test"),
}));

describe("FirstRunWalkthrough accessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAuthorization.mockResolvedValue(true);
    mockSelectApps.mockResolvedValue({ count: 1 });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("identifies the current step and headings", async () => {
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);

    expect(screen.getByLabelText("Welcome, step 1 of 4, current step")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Put some distance between you and distraction." })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Choose apps, step 2 of 4, current step")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Which apps should ScanLock restrict?" })).toBeOnTheScreen();
  });

  it("offers Print or Share on the QR code step", async () => {
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);

    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("button", { name: "Print or Share QR code" })).toBeEnabled();
  });

  it("opens the app picker immediately after authorization is accepted", async () => {
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await fireEvent.press(screen.getByRole("button", { name: "Select Apps" }));

    expect(mockRequestAuthorization).toHaveBeenCalledTimes(1);
    expect(mockSelectApps).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "Permission required",
      expect.any(String)
    );
  });

  it("does not open the onboarding picker when authorization is denied", async () => {
    mockRequestAuthorization.mockResolvedValue(false);
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await fireEvent.press(screen.getByRole("button", { name: "Select Apps" }));

    expect(mockSelectApps).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission required",
      "Screen Time permission is required to choose apps."
    );
  });

  it("reports disabled and busy button state", async () => {
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);

    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Skip setup" })).toHaveProp("accessibilityState", {
      disabled: false,
      busy: false,
    });
  });
});
