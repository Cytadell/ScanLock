import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useLockScanner } from "@/hooks/use-lock-scanner";

const mockGetLocked = jest.fn();
const mockIsAuthorized = jest.fn();
const mockRequestAuthorization = jest.fn();
const mockSetBlockingEnabled = jest.fn();
const mockValidateQrPayload = jest.fn();
const mockRequestPermission = jest.fn();
const mockImpactAsync = jest.fn();
const mockNotificationAsync = jest.fn();
const mockSelectionAsync = jest.fn();

let mockCameraPermission: { granted: boolean } | null = { granted: true };

jest.mock("@/services/appBlocker", () => ({
  getLocked: () => mockGetLocked(),
  isAuthorized: () => mockIsAuthorized(),
  requestAuthorization: () => mockRequestAuthorization(),
  setBlockingEnabled: (enabled: boolean) => mockSetBlockingEnabled(enabled),
}));

jest.mock("@/services/qrCode", () => ({
  validateQrPayload: (value: string) => mockValidateQrPayload(value),
}));

jest.mock("expo-camera", () => ({
  useCameraPermissions: () => [mockCameraPermission, mockRequestPermission],
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Medium: "medium" },
  NotificationFeedbackType: { Error: "error", Success: "success" },
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  selectionAsync: (...args: unknown[]) => mockSelectionAsync(...args),
}));

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
  };
});

const barcode = { data: "qr-payload", type: "qr", cornerPoints: [], bounds: undefined } as never;

describe("useLockScanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCameraPermission = { granted: true };
    mockGetLocked.mockReturnValue(false);
    mockIsAuthorized.mockReturnValue(true);
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockValidateQrPayload.mockResolvedValue(true);
    mockRequestAuthorization.mockResolvedValue(true);
    mockSetBlockingEnabled.mockImplementation(async (enabled: boolean) => ({
      status: enabled ? "locked" : "unlocked",
      locked: enabled,
    }));
  });

  it("loads the persisted lock state when focused", async () => {
    mockGetLocked.mockReturnValue(true);

    const { result } = await renderHook(() => useLockScanner());

    expect(result.current.locked).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("opens directly into scanning when camera permission exists", async () => {
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.status).toBe("scanning");
    expect(mockIsAuthorized).toHaveBeenCalledTimes(1);
    expect(mockRequestAuthorization).not.toHaveBeenCalled();
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it("requests Screen Time permission before opening the lock scanner", async () => {
    mockIsAuthorized.mockReturnValue(false);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(mockRequestAuthorization).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.status).toBe("scanning");
  });

  it("does not open the scanner when Screen Time permission is denied", async () => {
    mockIsAuthorized.mockReturnValue(false);
    mockRequestAuthorization.mockResolvedValue(false);
    mockCameraPermission = { granted: false };
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(mockRequestAuthorization).toHaveBeenCalledTimes(1);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it("opens the unlock scanner without requesting Screen Time permission", async () => {
    mockGetLocked.mockReturnValue(true);
    mockIsAuthorized.mockReturnValue(false);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(mockIsAuthorized).not.toHaveBeenCalled();
    expect(mockRequestAuthorization).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("requests missing camera permission", async () => {
    mockCameraPermission = { granted: false };
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("scanning");
  });

  it("reports denied camera permission", async () => {
    mockCameraPermission = { granted: false };
    mockRequestPermission.mockResolvedValue({ granted: false });
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.status).toBe("permission-denied");
  });

  it("locks after a valid scan and authorization", async () => {
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(mockValidateQrPayload).toHaveBeenCalledWith("qr-payload");
    expect(mockRequestAuthorization).toHaveBeenCalledTimes(1);
    expect(mockSetBlockingEnabled).toHaveBeenCalledWith(true);
    expect(result.current.locked).toBe(true);
    expect(result.current.status).toBe("success");
    expect(mockNotificationAsync).toHaveBeenCalledWith("success");
  });

  it("unlocks without requesting authorization", async () => {
    mockGetLocked.mockReturnValue(true);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(mockRequestAuthorization).not.toHaveBeenCalled();
    expect(mockSetBlockingEnabled).toHaveBeenCalledWith(false);
    expect(result.current.locked).toBe(false);
  });

  it("rejects an invalid QR code without changing native state", async () => {
    mockValidateQrPayload.mockResolvedValue(false);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(result.current.status).toBe("invalid-code");
    expect(mockRequestAuthorization).not.toHaveBeenCalled();
    expect(mockSetBlockingEnabled).not.toHaveBeenCalled();
    expect(mockNotificationAsync).toHaveBeenCalledWith("error");
  });

  it("shows a validation error and permits a retry", async () => {
    mockValidateQrPayload.mockRejectedValue(new Error("storage failed"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toContain("verify this QR code");

    await act(() => result.current.retry());

    expect(result.current.status).toBe("scanning");
    expect(result.current.errorMessage).toBeUndefined();
    consoleError.mockRestore();
  });

  it("reports an authorization denial without enabling blocking", async () => {
    mockRequestAuthorization.mockResolvedValue(false);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe(
      "App blocking permission is required to update your apps."
    );
    expect(mockSetBlockingEnabled).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("rejects a native result that does not match the requested state", async () => {
    mockSetBlockingEnabled.mockResolvedValue({ status: "unlocked", locked: false });
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.handleBarcodeScanned(barcode);
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("The blocking state could not be verified.");
    expect(result.current.locked).toBe(false);
    consoleError.mockRestore();
  });

  it("ignores duplicate scans while verification is in flight", async () => {
    let finishValidation!: (valid: boolean) => void;
    mockValidateQrPayload.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishValidation = resolve;
      })
    );
    const { result } = await renderHook(() => useLockScanner());

    let firstScan!: Promise<void>;
    await act(() => {
      firstScan = result.current.handleBarcodeScanned(barcode);
      void result.current.handleBarcodeScanned(barcode);
    });

    expect(mockValidateQrPayload).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishValidation(true);
      await firstScan;
    });
  });

  it("closes after the success delay", async () => {
    jest.useFakeTimers();
    const { result } = await renderHook(() => useLockScanner());

    await act(async () => {
      await result.current.open();
      await result.current.handleBarcodeScanned(barcode);
    });
    expect(result.current.isOpen).toBe(true);

    await act(() => {
      jest.advanceTimersByTime(1250);
    });

    await waitFor(() => expect(result.current.isOpen).toBe(false));
  });

  it("toggles the torch and clears it when closed", async () => {
    const { result } = await renderHook(() => useLockScanner());

    await act(() => result.current.toggleTorch());
    expect(result.current.torchEnabled).toBe(true);
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);

    await act(() => result.current.close());
    expect(result.current.torchEnabled).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });
});
