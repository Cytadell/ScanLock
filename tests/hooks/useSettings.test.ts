import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useEffect } from "react";
import { Alert } from "react-native";

import { useSettings } from "@/hooks/use-settings";

const mockGetLocked = jest.fn(() => false);
const mockGetSelectedAppCount = jest.fn(async () => 0);
const mockRequestAuthorization = jest.fn(async () => true);
const mockSelectApps = jest.fn(async () => ({ count: 2 }));
const mockUseEffect = useEffect;

jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => mockUseEffect(effect, [effect]),
}));

jest.mock("@/services/appBlocker", () => ({
  getLocked: () => mockGetLocked(),
  getSelectedAppCount: () => mockGetSelectedAppCount(),
  requestAuthorization: () => mockRequestAuthorization(),
  selectApps: () => mockSelectApps(),
  setBlockingEnabled: jest.fn(),
}));

describe("useSettings app picker authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocked.mockReturnValue(false);
    mockGetSelectedAppCount.mockResolvedValue(0);
    mockRequestAuthorization.mockResolvedValue(true);
    mockSelectApps.mockResolvedValue({ count: 2 });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("opens the Settings tab picker immediately after authorization is accepted", async () => {
    const { result } = await renderHook(() => useSettings());

    await act(async () => {
      await result.current.selectBlockedApps();
    });

    expect(mockRequestAuthorization).toHaveBeenCalledTimes(1);
    expect(mockSelectApps).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.selectedAppCount).toBe(2));
    expect(result.current.selectionRefreshKey).toBe(1);
    expect(Alert.alert).not.toHaveBeenCalledWith("Permission Required", expect.any(String));
  });

  it("shows the permission message and skips the picker after denial", async () => {
    mockRequestAuthorization.mockResolvedValue(false);
    const { result } = await renderHook(() => useSettings());

    await act(async () => {
      await result.current.selectBlockedApps();
    });

    expect(mockSelectApps).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Permission Required",
      "Screen Time permission is required to select apps."
    );
  });
});
