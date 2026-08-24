import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import GetLockScreen from "@/app/(tabs)/getlock";

const mockShareQrCode = jest.fn();
const mockPrepareFoldablePreview = jest.fn();
let mockFoldablePreviewHtml: string | null;
let mockIsPreparingPreview: boolean;
let mockPreviewError: string | null;
let mockIsSharing: boolean;

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  return { WebView: (props: object) => React.createElement(View, props) };
});
jest.mock("@/hooks/use-get-lock", () => ({
  useGetLock: () => ({
    qrPayload: "scanlock:test",
    qrCardRef: { current: null },
    foldablePreviewHtml: mockFoldablePreviewHtml,
    isPreparingPreview: mockIsPreparingPreview,
    previewError: mockPreviewError,
    isSharing: mockIsSharing,
    prepareFoldablePreview: mockPrepareFoldablePreview,
    shareQrCode: mockShareQrCode,
  }),
}));

describe("GetLockScreen format previews", () => {
  beforeEach(() => {
    mockFoldablePreviewHtml = "<html>foldable-preview</html>";
    mockIsPreparingPreview = false;
    mockPreviewError = null;
    mockIsSharing = false;
  });

  it("starts with two described format choices and no print action", async () => {
    await render(<GetLockScreen />);

    expect(screen.getByRole("header", { name: "Print your ScanLock" })).toBeOnTheScreen();
    expect(screen.queryByRole("header", { name: "Choose what to print" })).not.toBeOnTheScreen();
    expect(screen.getByText(/need to print a physical ScanLock to lock and unlock apps/)).toBeOnTheScreen();
    expect(screen.getByText("CHOOSE A FORMAT")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Foldable card, recommended" })).toBeOnTheScreen();
    expect(screen.getByText("Prints on one letter-size page, then folds into a small standing card.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "QR image" })).toBeOnTheScreen();
    expect(screen.getByText("A standalone PNG you can resize, place in a document, or print yourself.")).toBeOnTheScreen();
    expect(screen.getByText(/Place your printed ScanLock away from you/)).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /Print or Share/ })).not.toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Close preview" })).not.toBeOnTheScreen();
  });

  it("prepares and displays the foldable card before sharing it", async () => {
    await render(<GetLockScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Foldable card, recommended" }));

    expect(mockPrepareFoldablePreview).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Preview of the foldable card printout")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Print or Share Foldable Card" }));
    expect(mockShareQrCode).toHaveBeenCalledWith("foldable");
  });

  it("displays and shares the branded PNG preview", async () => {
    await render(<GetLockScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "QR image" }));

    expect(screen.getByLabelText("Your ScanLock QR key. Keep this code away from your phone.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Print or Share PNG Image" }));
    expect(mockShareQrCode).toHaveBeenCalledWith("png");
  });

  it("closes a preview with the close button", async () => {
    await render(<GetLockScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "QR image" }));

    await fireEvent.press(screen.getByRole("button", { name: "Close preview" }));

    expect(screen.getByRole("button", { name: "Foldable card, recommended" })).toBeOnTheScreen();
  });

  it("uses Android back to return from a preview to the chooser", async () => {
    let hardwareBackHandler: (() => boolean | null | undefined) | undefined;
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
      hardwareBackHandler = handler;
      return { remove: jest.fn() };
    });
    await render(<GetLockScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "QR image" }));

    await act(() => {
      expect(hardwareBackHandler?.()).toBe(true);
    });

    expect(screen.getByRole("button", { name: "Foldable card, recommended" })).toBeOnTheScreen();
  });

  it("offers a retry when preparing the foldable preview fails", async () => {
    mockFoldablePreviewHtml = null;
    mockPreviewError = "The foldable card preview could not be prepared.";
    await render(<GetLockScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "Foldable card, recommended" }));

    expect(screen.getByText("Preview unavailable")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Retry foldable card preview" }));
    expect(mockPrepareFoldablePreview).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Print or Share Foldable Card" })).toBeDisabled();
  });

  it("disables repeated sharing while an export is in progress", async () => {
    mockIsSharing = true;
    await render(<GetLockScreen />);
    await fireEvent.press(screen.getByRole("button", { name: "QR image" }));

    const shareButton = screen.getByRole("button", { name: "Print or Share PNG Image" });
    expect(shareButton).toBeDisabled();
    await fireEvent.press(shareButton);
    expect(mockShareQrCode).not.toHaveBeenCalled();
  });
});
