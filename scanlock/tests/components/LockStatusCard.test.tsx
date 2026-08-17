import { fireEvent, render, screen } from "@testing-library/react-native";

import { LockStatusCard } from "@/components/scanner/LockStatusCard";

const mockImpactAsync = jest.fn();

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native/Libraries/Utilities/warnOnce", () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "light" },
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
}));

describe("LockStatusCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [false, "Your apps are available", "Scan to lock"],
    [true, "Your apps are locked", "Scan to unlock"],
  ])("renders the %p lock state", async (locked, title, action) => {
    await render(<LockStatusCard locked={locked} lockElapsed="01:02:03" onScan={jest.fn()} />);

    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText(action)).toBeOnTheScreen();
    expect(screen.queryByText("01:02:03")).toBe(locked ? screen.getByText("01:02:03") : null);
  });

  it("starts scanning with haptic feedback", async () => {
    const onScan = jest.fn();
    await render(<LockStatusCard locked={false} lockElapsed="00:00:00" onScan={onScan} />);

    await fireEvent.press(screen.getByLabelText("Scan a QR code to lock apps"));

    expect(mockImpactAsync).toHaveBeenCalledWith("light");
    expect(onScan).toHaveBeenCalledTimes(1);
  });

  it("opens and closes the help sheet", async () => {
    await render(<LockStatusCard locked={false} lockElapsed="00:00:00" onScan={jest.fn()} />);

    await fireEvent.press(screen.getByLabelText("Open help"));
    expect(screen.getByText("ScanLock help")).toBeOnTheScreen();
    expect(screen.getByText("STEP 1")).toBeOnTheScreen();

    const closeButtons = screen.getAllByLabelText("Close help");
    await fireEvent.press(closeButtons.at(-1)!);

    expect(screen.queryByText("ScanLock help")).not.toBeOnTheScreen();
  });
});
