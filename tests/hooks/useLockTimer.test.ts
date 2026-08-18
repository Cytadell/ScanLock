import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";

import { formatLockDuration, useLockTimer } from "@/hooks/use-lock-timer";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<typeof AsyncStorage.removeItem>;

describe("useLockTimer", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1_776_597_600_000);
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatLockDuration(3723)).toBe("01:02:03");
  });

  it("starts a new timer from the current timestamp", async () => {
    const { result } = await renderHook(() => useLockTimer());

    await act(async () => {
      await result.current.start();
    });

    expect(mockSetItem).toHaveBeenCalledWith("@scanlock/locked-at", String(Date.now()));
    expect(result.current.formattedElapsed).toBe("00:00:00");

  });

  it("restores an existing timer when native state is locked", async () => {
    mockGetItem.mockResolvedValue(String(Date.now() - 3_723_000));
    const { result } = await renderHook(() => useLockTimer());

    await act(async () => {
      await result.current.syncWithLockState(true);
    });

    expect(result.current.formattedElapsed).toBe("01:02:03");
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("clears timer state when native state is unlocked", async () => {
    const { result } = await renderHook(() => useLockTimer());

    await act(async () => {
      await result.current.start();
      await result.current.syncWithLockState(false);
    });

    expect(mockRemoveItem).toHaveBeenCalledWith("@scanlock/locked-at");
    expect(result.current.formattedElapsed).toBe("00:00:00");
  });
});
