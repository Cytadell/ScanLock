import AsyncStorage from "@react-native-async-storage/async-storage";

const QR_KEY_READY_KEY = "scanlock:qrKeyReady";

let readyForCurrentSession = false;

export async function hasQrKeyReady(): Promise<boolean> {
  if (readyForCurrentSession) return true;

  const storedValue = (await AsyncStorage.getItem(QR_KEY_READY_KEY)) === "true";
  if (storedValue) readyForCurrentSession = true;
  return storedValue;
}

export async function markQrKeyReady(): Promise<void> {
  readyForCurrentSession = true;
  await AsyncStorage.setItem(QR_KEY_READY_KEY, "true");
}

export async function resetQrKeyReady(): Promise<void> {
  readyForCurrentSession = false;
  await AsyncStorage.removeItem(QR_KEY_READY_KEY);
}
