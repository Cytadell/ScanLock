import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const QR_KEY_ID_KEY = "scanlock:qr-key-id:v1";
const QR_PAYLOAD_PREFIX = "SL1:";
const STORED_KEY_ID_PATTERN = /^[0-9a-f]{16}(?:[0-9a-f]{16})?$/i;
const LEGACY_KEY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ScanLockQrPayload = {
  version: 1;
  keyId: string;
};

let keyCreationPromise: Promise<string> | null = null;

export async function getOrCreateQrPayload(): Promise<string> {
  return encodeQrPayload(await getOrCreateKeyId());
}

export async function validateQrPayload(value: string): Promise<boolean> {
  return parseQrPayload(value) !== null;
}

export function parseQrPayload(value: string): ScanLockQrPayload | null {
  const compactMatch = /^SL1:([0-9a-f]{16})$/i.exec(value);
  if (compactMatch) {
    return { version: 1, keyId: compactMatch[1].toLowerCase() };
  }

  // Keep already-printed v1 codes working after the compact format ships.
  try {
    const payload: unknown = JSON.parse(value);

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("type" in payload) ||
      !("version" in payload) ||
      !("keyId" in payload) ||
      payload.type !== "scanlock-key" ||
      payload.version !== 1 ||
      typeof payload.keyId !== "string" ||
      !LEGACY_KEY_ID_PATTERN.test(payload.keyId)
    ) {
      return null;
    }

    return {
      version: 1,
      keyId: payload.keyId.replaceAll("-", "").toLowerCase(),
    };
  } catch {
    return null;
  }
}

async function getOrCreateKeyId(): Promise<string> {
  const savedKeyId = await AsyncStorage.getItem(QR_KEY_ID_KEY);
  if (savedKeyId) {
    const storedKeyId = savedKeyId.replaceAll("-", "");
    if (STORED_KEY_ID_PATTERN.test(storedKeyId)) {
      return storedKeyId.slice(0, 16).toUpperCase();
    }
  }

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
  return Crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
}

function encodeQrPayload(keyId: string): string {
  return `${QR_PAYLOAD_PREFIX}${keyId}`;
}
