import { fireEvent, render, screen } from "@testing-library/react-native";

import GetLockScreen from "@/app/(tabs)/getlock";

const mockShareQrCode = jest.fn();

jest.mock("@expo/vector-icons/MaterialIcons", () => () => null);
jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("@/hooks/use-get-lock", () => ({
  useGetLock: () => ({
    qrPayload: "scanlock:test",
    qrCardRef: { current: null },
    isSharing: false,
    shareQrCode: mockShareQrCode,
  }),
}));

describe("GetLockScreen formats", () => {
  beforeEach(() => {
    mockShareQrCode.mockClear();
  });

  it("defaults to the foldable card format", async () => {
    await render(<GetLockScreen />);

    expect(screen.getByRole("radio", { name: "Foldable Card (recommended)" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Print or Share Foldable Card" }));

    expect(mockShareQrCode).toHaveBeenCalledWith("foldable");
  });

  it("lets the user select and share the PNG image", async () => {
    await render(<GetLockScreen />);

    await fireEvent.press(screen.getByRole("radio", { name: "Image" }));
    await fireEvent.press(screen.getByRole("button", { name: "Print or Share PNG Image" }));

    expect(mockShareQrCode).toHaveBeenCalledWith("png");
  });
});
