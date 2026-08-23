import { render, screen } from "@testing-library/react-native";

import { QrKeyCard } from "@/components/qr/QrKeyCard";

jest.mock("react-native-qrcode-svg", () => () => null);
jest.mock("@/components/icons/PadlockQrCodeIcon", () => ({
  PadlockQrCodeIcon: () => null,
}));

describe("QrKeyCard export layouts", () => {
  it("centers the title on the portrait preview", async () => {
    await render(<QrKeyCard qrPayload="scanlock:test" width={270} qrSize={180} />);

    expect(screen.getByText("Your ScanLock key")).toHaveStyle({ textAlign: "center" });
    expect(screen.queryByText("ScanLock")).not.toBeOnTheScreen();
  });

  it("restores the ScanLock brand on the printable PNG", async () => {
    await render(<QrKeyCard qrPayload="scanlock:test" width={310} qrSize={220} showBrand />);

    expect(screen.getByText("ScanLock")).toBeOnTheScreen();
    expect(screen.getByText("Your ScanLock key")).toBeOnTheScreen();
  });
});
