import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import {
  getOrCreateQrPayload,
  parseQrPayload,
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
    mockRandomUUID.mockReturnValue("123e4567-e89b-42d3-a456-426614174000");
  });

  describe("parseQrPayload", () => {
    it("parses a compact ScanLock payload", () => {
      expect(parseQrPayload("SL1:123E4567E89B42D3")).toEqual({
        version: 1,
        keyId: "123e4567e89b42d3",
      });
    });

    it("continues to parse previously printed JSON payloads", () => {
      const value = JSON.stringify({
        type: "scanlock-key",
        version: 1,
        keyId: "123e4567-e89b-42d3-a456-426614174000",
      });

      expect(parseQrPayload(value)).toEqual({
        version: 1,
        keyId: "123e4567e89b42d3a456426614174000",
      });
    });

    it.each([
      ["malformed JSON", "not-json"],
      ["an incomplete compact code", "SL1:1234"],
      ["a compact code with invalid characters", "SL1:ZZZE4567E89B42D3"],
      ["a compact code with trailing content", "SL1:123E4567E89B42D3:anything"],
      ["a primitive", JSON.stringify("scanlock-key")],
      ["the wrong type", JSON.stringify({ type: "other", version: 1, keyId: "123e4567-e89b-42d3-a456-426614174000" })],
      ["the wrong version", JSON.stringify({ type: "scanlock-key", version: 2, keyId: "123e4567-e89b-42d3-a456-426614174000" })],
      ["a missing key", JSON.stringify({ type: "scanlock-key", version: 1 })],
      ["a non-UUID legacy key", JSON.stringify({ type: "scanlock-key", version: 1, keyId: "device-key" })],
    ])("rejects %s", (_description, value) => {
      expect(parseQrPayload(value)).toBeNull();
    });
  });

  describe("getOrCreateQrPayload", () => {
    it("reuses a persisted key", async () => {
      mockGetItem.mockResolvedValue("123e4567-e89b-42d3-a456-426614174000");

      await expect(getOrCreateQrPayload()).resolves.toBe(
        "SL1:123E4567E89B42D3"
      );
      expect(mockRandomUUID).not.toHaveBeenCalled();
      expect(mockSetItem).not.toHaveBeenCalled();
    });

    it("creates and persists a key when one does not exist", async () => {
      await expect(getOrCreateQrPayload()).resolves.toBe(
        "SL1:123E4567E89B42D3"
      );
      expect(mockSetItem).toHaveBeenCalledWith(
        QR_STORAGE_KEY,
        "123E4567E89B42D3"
      );
    });

    it("shares one key creation across concurrent callers", async () => {
      const payloads = await Promise.all([getOrCreateQrPayload(), getOrCreateQrPayload()]);

      expect(payloads[0]).toBe(payloads[1]);
      expect(mockRandomUUID).toHaveBeenCalledTimes(1);
      expect(mockSetItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateQrPayload", () => {
    it("accepts any well-formed ScanLock code without reading device storage", async () => {
      await expect(
        validateQrPayload("SL1:AAAAAAAAAAAAAAAA")
      ).resolves.toBe(true);
      expect(mockGetItem).not.toHaveBeenCalled();
    });

    it("rejects malformed payloads without reading device storage", async () => {
      await expect(validateQrPayload("not-json")).resolves.toBe(false);
      expect(mockGetItem).not.toHaveBeenCalled();
    });
  });

});
