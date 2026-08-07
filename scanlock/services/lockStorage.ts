// services/lockStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCKED_KEY = "qr-brick:isLocked";

export async function getLocked(): Promise<boolean> {
  const value = await AsyncStorage.getItem(LOCKED_KEY);
  return value === "true";
}

export async function setLocked(locked: boolean): Promise<void> {
  await AsyncStorage.setItem(LOCKED_KEY, String(locked));
}