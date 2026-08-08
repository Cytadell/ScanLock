import { requireOptionalNativeModule } from "expo-modules-core";

export type BlockedAppSelection = {
  count: number;
};

type AppBlockerNativeModule = {
  requestAuthorization(): Promise<boolean>;
  selectApps(): Promise<void>;
  getSelectedAppCount(): number;
  enableBlocking(): Promise<void>;
  disableBlocking(): Promise<void>;
};

const nativeAppBlocker =
  requireOptionalNativeModule<AppBlockerNativeModule>("AppBlocker");

export async function requestAuthorization(): Promise<boolean> {
  if (nativeAppBlocker) {
    return nativeAppBlocker.requestAuthorization();
  }

  console.log("Mock: request Screen Time authorization (native module unavailable)");
  return true;
}

export async function selectApps(): Promise<BlockedAppSelection> {
  if (nativeAppBlocker) {
    await nativeAppBlocker.selectApps();
    return { count: nativeAppBlocker.getSelectedAppCount() };
  }

  console.log("Mock: open app picker (native module unavailable)");
  return { count: 3 };
}

export async function getSelectedAppCount(): Promise<number> {
  if (nativeAppBlocker) {
    return nativeAppBlocker.getSelectedAppCount();
  }

  return 0;
}

export async function enableBlocking(): Promise<void> {
  if (nativeAppBlocker) {
    await nativeAppBlocker.enableBlocking();
    return;
  }

  console.log("Mock: blocking enabled (native module unavailable)");
}

export async function disableBlocking(): Promise<void> {
  if (nativeAppBlocker) {
    await nativeAppBlocker.disableBlocking();
    return;
  }

  console.log("Mock: blocking disabled (native module unavailable)");
}
