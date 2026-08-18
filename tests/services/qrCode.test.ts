import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  generateUniversalQrPayload,
  getOrCreateQrPayload,
  parseQrPayload,
  rotateQrKey,
  validateQrPayload,
} from "@/services/qrCode";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockRandomUUID = Crypto.randomUUID as jest.MockedFunction<typeof Crypto.randomUUID>;

const QR_STORAGE_KEY = "scanlock:qr-key-id:v1";

describe("QR code service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRandomUUID.mockReturnValue("generated-key");
  });

  describe("parseQrPayload", () => {
    it("parses a supported ScanLock payload", () => {
      expect(
        parseQrPayload(
          JSON.stringify({ type: "scanlock-key", version: 1, keyId: "device-key" })
        )
      ).toEqual({ type: "scanlock-key", version: 1, keyId: "device-key" });
    });

    it.each([
      ["malformed JSON", "not-json"],
      ["a primitive", JSON.stringify("scanlock-key")],
      ["the wrong type", JSON.stringify({ type: "other", version: 1, keyId: "key" })],
      ["the wrong version", JSON.stringify({ type: "scanlock-key", version: 2, keyId: "key" })],
      ["a missing key", JSON.stringify({ type: "scanlock-key", version: 1 })],
      ["an empty key", JSON.stringify({ type: "scanlock-key", version: 1, keyId: "" })],
    ])("rejects %s", (_description, value) => {
      expect(parseQrPayload(value)).toBeNull();
    });
  });

  describe("getOrCreateQrPayload", () => {
    it("reuses a persisted key", async () => {
      mockGetItem.mockResolvedValue("existing-key");

      await expect(getOrCreateQrPayload()).resolves.toBe(
        JSON.stringify({ type: "scanlock-key", version: 1, keyId: "existing-key" })
      );
      expect(mockRandomUUID).not.toHaveBeenCalled();
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it("creates and persists a key when one does not exist", async () => {
      await expect(getOrCreateQrPayload()).resolves.toBe(
        JSON.stringify({ type: "scanlock-key", version: 1, keyId: "generated-key" })
      );
      expect(mockSetItem).toHaveBeenCalledWith(QR_STORAGE_KEY, "generated-key");
    });

    it("shares one key creation across concurrent callers", async () => {
      const payloads = await Promise.all([getOrCreateQrPayload(), getOrCreateQrPayload()]);

      expect(payloads[0]).toBe(payloads[1]);
      expect(mockRandomUUID).toHaveBeenCalledTimes(1);
      expect(mockSetItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateQrPayload", () => {
    it("accepts the persisted device key", async () => {
      mockGetItem.mockResolvedValue("device-key");
      const payload = JSON.stringify({ type: "scanlock-key", version: 1, keyId: "device-key" });

      await expect(validateQrPayload(payload)).resolves.toBe(true);
    });

    it("rejects a different device key", async () => {
      mockGetItem.mockResolvedValue("device-key");
      const payload = JSON.stringify({ type: "scanlock-key", version: 1, keyId: "other-key" });

      await expect(validateQrPayload(payload)).resolves.toBe(false);
    });

    it("accepts the universal key without reading device storage", async () => {
      await expect(validateQrPayload(generateUniversalQrPayload())).resolves.toBe(true);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it("rejects malformed payloads without reading device storage", async () => {
      await expect(validateQrPayload("not-json")).resolves.toBe(false);
      expect(mockGetItem).not.toHaveBeenCalled();
    });
  });

  it("rotates and persists a replacement key", async () => {
    mockRandomUUID.mockReturnValue("replacement-key");

    await expect(rotateQrKey()).resolves.toBe(
      JSON.stringify({ type: "scanlock-key", version: 1, keyId: "replacement-key" })
    );
    expect(mockSetItem).toHaveBeenCalledWith(QR_STORAGE_KEY, "replacement-key");
  });
});
