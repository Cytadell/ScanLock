import { fireEvent, render, screen } from "@testing-library/react-native";

import { FirstRunWalkthrough } from "@/components/onboarding/FirstRunWalkthrough";

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("react-native/Libraries/Utilities/warnOnce", () => ({
  __esModule: true,
  default: () => undefined,
}));
jest.mock("@/services/appBlocker", () => ({
  requestAuthorization: jest.fn(async () => true),
  selectApps: jest.fn(async () => ({ count: 1 })),
}));
jest.mock("@/services/qrCode", () => ({
  getOrCreateQrPayload: jest.fn(async () => "scanlock:test"),
}));

describe("FirstRunWalkthrough accessibility", () => {
  it("identifies the current step and headings", async () => {
    await render(<FirstRunWalkthrough onComplete={jest.fn(async () => undefined)} />);

    expect(screen.getByLabelText("Welcome, step 1 of 4, current step")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Put some distance between you and distraction." })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Choose apps, step 2 of 4, current step")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Which apps should ScanLock control?" })).toBeOnTheScreen();
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
