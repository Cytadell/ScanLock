import type { BlockedAppSelection } from "@/modules/app-blocker";
import { expoGoAppBlocker } from "@/services/appBlocker.expoGo";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type { BlockedAppSelection };

type AppBlockerNativeModule = {
  requestAuthorization(): Promise<boolean>;
  selectApps(): Promise<BlockedAppSelection>;
  isAuthorized(): boolean;
  getSelectedAppCount(): number;
  hasSelection(): boolean;
  enableBlocking(): Promise<void>;
  disableBlocking(): Promise<void>;
  clearSelection(): Promise<void>;
};

const nativeAppBlocker =
  requireOptionalNativeModule<AppBlockerNativeModule>("AppBlocker");

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function requireAppBlocker(): AppBlockerNativeModule {
  if (isExpoGo) {
    return expoGoAppBlocker;
  }

  if (!nativeAppBlocker) {
    throw new Error(
      Platform.OS === "ios"
        ? "AppBlocker is missing from this iOS build. Rebuild the native app."
        : "App blocking is not available on this platform yet."
    );
  }

  return nativeAppBlocker;
}

export async function requestAuthorization(): Promise<boolean> {
  return requireAppBlocker().requestAuthorization();
}

export async function selectApps(): Promise<BlockedAppSelection> {
  return requireAppBlocker().selectApps();
}

export async function getSelectedAppCount(): Promise<number> {
  return requireAppBlocker().getSelectedAppCount();
}

export function isAuthorized(): boolean {
  return requireAppBlocker().isAuthorized();
}

export function hasSelection(): boolean {
  return requireAppBlocker().hasSelection();
}

export async function enableBlocking(): Promise<void> {
  await requireAppBlocker().enableBlocking();
}

export async function disableBlocking(): Promise<void> {
  await requireAppBlocker().disableBlocking();
}

export async function clearSelection(): Promise<void> {
  await requireAppBlocker().clearSelection();
}
