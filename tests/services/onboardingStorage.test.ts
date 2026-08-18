import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  completeOnboarding,
  hasCompletedOnboarding,
  resetOnboarding,
} from "@/services/onboardingStorage";

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
const STORAGE_KEY = "scanlock:onboardingComplete";

describe("onboarding storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [null, false],
    ["false", false],
    ["true", true],
  ])("maps the stored value %p to %p", async (storedValue, expected) => {
    mockGetItem.mockResolvedValue(storedValue);

    await expect(hasCompletedOnboarding()).resolves.toBe(expected);
  });

  it("marks onboarding complete", async () => {
    mockSetItem.mockResolvedValue(undefined);

    await completeOnboarding();

    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, "true");
  });

  it("removes the completion marker when reset", async () => {
    mockRemoveItem.mockResolvedValue(undefined);

    await resetOnboarding();

    expect(mockRemoveItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it("surfaces storage failures", async () => {
    mockGetItem.mockRejectedValue(new Error("storage unavailable"));

    await expect(hasCompletedOnboarding()).rejects.toThrow("storage unavailable");
  });
});
