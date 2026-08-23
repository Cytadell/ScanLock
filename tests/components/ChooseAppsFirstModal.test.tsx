import { fireEvent, render, screen } from "@testing-library/react-native";

import { ChooseAppsFirstModal } from "@/components/scanner/ChooseAppsFirstModal";

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("@/hooks/use-reduce-motion", () => ({
  useReduceMotion: () => true,
}));

describe("ChooseAppsFirstModal", () => {
  it("shows app-picker and defer actions", async () => {
    const onDismiss = jest.fn();
    const onChooseApps = jest.fn();
    await render(<ChooseAppsFirstModal visible choosing={false} onChooseApps={onChooseApps} onDismiss={onDismiss} />);

    expect(screen.getByRole("header", { name: "Choose apps first" })).toBeOnTheScreen();
    expect(screen.getByText("Open the Settings tab and select at least one app, category, or website before locking.")).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Choose apps" }));
    expect(onChooseApps).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: "Not now" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
