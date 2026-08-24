import { render } from "@testing-library/react-native";

import { SelectedActivityList } from "@/components/app-blocker/SelectedActivityList";

const mockRequireNativeView = jest.fn();

jest.mock("expo", () => ({
  requireNativeView: (...args: unknown[]) => mockRequireNativeView(...args),
}));

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: () => ({}),
}));

describe("SelectedActivityList native compatibility", () => {
  it("falls back safely when an older native build has AppBlocker without the view", async () => {
    const view = await render(
      <SelectedActivityList refreshKey={0} selectionCount={2} />
    );

    expect(view.getByLabelText("2 selected items")).toBeOnTheScreen();
    expect(mockRequireNativeView).not.toHaveBeenCalled();
  });

  it("renders nothing for an empty selection", async () => {
    const { toJSON } = await render(
      <SelectedActivityList refreshKey={0} selectionCount={0} />
    );

    expect(toJSON()).toBeNull();
  });
});
