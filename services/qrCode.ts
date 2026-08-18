import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const QR_KEY_ID_KEY = "scanlock:qr-key-id:v1";
const QR_PAYLOAD_TYPE = "scanlock-key";
const QR_PAYLOAD_VERSION = 1;
const UNIVERSAL_QR_KEY_ID = "scanlock-universal-key";

export const isUniversalQrEnabled =
  __DEV__ || process.env.EXPO_PUBLIC_ENABLE_UNIVERSAL_QR === "true";

export type ScanLockQrPayload = {
  type: typeof QR_PAYLOAD_TYPE;
  version: typeof QR_PAYLOAD_VERSION;
  keyId: string;
};

let keyCreationPromise: Promise<string> | null = null;

export async function getOrCreateQrPayload(): Promise<string> {
  return encodeQrPayload(await getOrCreateKeyId());
}

export function generateUniversalQrPayload(): string {
  if (!isUniversalQrEnabled) {
    throw new Error("The universal QR code is disabled in this build.");
  }

  return encodeQrPayload(UNIVERSAL_QR_KEY_ID);
}

export async function validateQrPayload(value: string): Promise<boolean> {
  const payload = parseQrPayload(value);
  if (!payload) return false;
  if (isUniversalQrEnabled && payload.keyId === UNIVERSAL_QR_KEY_ID) return true;

  const savedKeyId = await AsyncStorage.getItem(QR_KEY_ID_KEY);
  return savedKeyId !== null && payload.keyId === savedKeyId;
}

export async function rotateQrKey(): Promise<string> {
  const keyId = createSecureKeyId();
  await AsyncStorage.setItem(QR_KEY_ID_KEY, keyId);
  return encodeQrPayload(keyId);
}

export function parseQrPayload(value: string): ScanLockQrPayload | null {
  try {
    const payload: unknown = JSON.parse(value);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("type" in payload) ||
      !("version" in payload) ||
      !("keyId" in payload) ||
      payload.type !== QR_PAYLOAD_TYPE ||
      payload.version !== QR_PAYLOAD_VERSION ||
      typeof payload.keyId !== "string" ||
      payload.keyId.length === 0
    ) {
      return null;
    }

    return {
      type: QR_PAYLOAD_TYPE,
      version: QR_PAYLOAD_VERSION,
      keyId: payload.keyId,
    };
  } catch {
    return null;
  }
}

async function getOrCreateKeyId(): Promise<string> {
  const savedKeyId = await AsyncStorage.getItem(QR_KEY_ID_KEY);
  if (savedKeyId) return savedKeyId;

  keyCreationPromise ??= createAndSaveKeyId();

  try {
    return await keyCreationPromise;
  } finally {
    keyCreationPromise = null;
  }
}

async function createAndSaveKeyId(): Promise<string> {
  const keyId = createSecureKeyId();
  await AsyncStorage.setItem(QR_KEY_ID_KEY, keyId);
  return keyId;
}

function createSecureKeyId(): string {
  return Crypto.randomUUID();
}

function encodeQrPayload(keyId: string): string {
  const payload: ScanLockQrPayload = {
    type: QR_PAYLOAD_TYPE,
    version: QR_PAYLOAD_VERSION,
    keyId,
  };

  return JSON.stringify(payload);
}
