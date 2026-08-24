jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

function loadReadinessService() {
  jest.resetModules();
  const AsyncStorage = require("@react-native-async-storage/async-storage").default as {
    getItem: jest.Mock;
    removeItem: jest.Mock;
    setItem: jest.Mock;
  };
  const readiness = require("@/services/qrKeyReadiness") as typeof import("@/services/qrKeyReadiness");
  return { AsyncStorage, readiness };
}

describe("QR key readiness storage", () => {
  it("defaults to false and persists confirmation", async () => {
    const { AsyncStorage, readiness } = loadReadinessService();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);

    await expect(readiness.hasQrKeyReady()).resolves.toBe(false);
    await readiness.markQrKeyReady();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("scanlock:qrKeyReady", "true");
    await expect(readiness.hasQrKeyReady()).resolves.toBe(true);
  });

  it("retains readiness for the session when persistence fails", async () => {
    const { AsyncStorage, readiness } = loadReadinessService();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockRejectedValue(new Error("storage failed"));

    await expect(readiness.markQrKeyReady()).rejects.toThrow("storage failed");
    await expect(readiness.hasQrKeyReady()).resolves.toBe(true);
  });

  it("clears both persisted and session readiness", async () => {
    const { AsyncStorage, readiness } = loadReadinessService();
    AsyncStorage.setItem.mockResolvedValue(undefined);
    AsyncStorage.removeItem.mockResolvedValue(undefined);
    AsyncStorage.getItem.mockResolvedValue(null);

    await readiness.markQrKeyReady();
    await readiness.resetQrKeyReady();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("scanlock:qrKeyReady");
    await expect(readiness.hasQrKeyReady()).resolves.toBe(false);
  });
});
