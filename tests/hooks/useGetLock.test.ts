import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { View } from "react-native";

import { useGetLock } from "@/hooks/use-get-lock";

const mockGetOrCreateQrPayload = jest.fn();
const mockGetOrCreateFoldableExport = jest.fn();
const mockGetOrCreatePngExport = jest.fn();
const mockSharingAvailable = jest.fn();
const mockShareAsync = jest.fn();
const mockMarkQrKeyReady = jest.fn();

jest.mock("@/services/qrCode", () => ({
  getOrCreateQrPayload: () => mockGetOrCreateQrPayload(),
}));
jest.mock("@/services/scanLockExport", () => ({
  getFoldableCardHtml: jest.fn(),
  getOrCreateFoldableExport: (...args: unknown[]) => mockGetOrCreateFoldableExport(...args),
  getOrCreatePngExport: (...args: unknown[]) => mockGetOrCreatePngExport(...args),
}));
jest.mock("@/services/qrKeyReadiness", () => ({
  markQrKeyReady: () => mockMarkQrKeyReady(),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: () => mockSharingAvailable(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));
jest.mock("react-native-view-shot", () => ({
  captureRef: jest.fn(async () => "file:///captured.png"),
}));

describe("useGetLock readiness", () => {
  beforeEach(() => {
    mockGetOrCreateQrPayload.mockResolvedValue("scanlock:test");
    mockGetOrCreateFoldableExport.mockResolvedValue({ uri: "file:///foldable.pdf" });
    mockGetOrCreatePngExport.mockResolvedValue({ uri: "file:///key.png" });
    mockSharingAvailable.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);
    mockMarkQrKeyReady.mockResolvedValue(undefined);
  });

  it.each(["foldable", "png"] as const)("marks readiness when %s Print or Share is pressed", async (format) => {
    const { result } = await renderHook(() => useGetLock());
    await waitFor(() => expect(result.current.qrPayload).toBe("scanlock:test"));
    result.current.qrCardRef.current = {} as View;

    await act(async () => result.current.shareQrCode(format));

    expect(mockMarkQrKeyReady).toHaveBeenCalledTimes(1);
    expect(mockShareAsync).toHaveBeenCalledTimes(1);
  });

  it("continues sharing when readiness persistence fails", async () => {
    mockMarkQrKeyReady.mockRejectedValue(new Error("storage failed"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await renderHook(() => useGetLock());
    await waitFor(() => expect(result.current.qrPayload).toBe("scanlock:test"));
    result.current.qrCardRef.current = {} as View;

    await act(async () => result.current.shareQrCode("png"));

    expect(mockShareAsync).toHaveBeenCalledWith("file:///key.png", expect.any(Object));
    consoleError.mockRestore();
  });
});
