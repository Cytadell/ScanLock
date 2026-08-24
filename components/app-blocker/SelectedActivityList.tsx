import Constants, { ExecutionEnvironment } from "expo-constants";
import { requireNativeView } from "expo";
import { requireOptionalNativeModule } from "expo-modules-core";
import type { ComponentType } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type NativeSelectedActivityListProps = {
  refreshKey: number;
  style?: StyleProp<ViewStyle>;
};

type SelectedActivityListProps = NativeSelectedActivityListProps & {
  selectionCount: number;
};

type AppBlockerViewCapabilities = {
  supportsSelectedActivityList?: boolean;
};

let resolvedNativeView:
  | ComponentType<NativeSelectedActivityListProps>
  | null
  | undefined;

function getNativeView(): ComponentType<NativeSelectedActivityListProps> | null {
  if (resolvedNativeView !== undefined) return resolvedNativeView;

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const appBlockerModule =
    requireOptionalNativeModule<AppBlockerViewCapabilities>("AppBlocker");
  const hasNativeView =
    appBlockerModule?.supportsSelectedActivityList === true;

  const nativeView =
    !isExpoGo && hasNativeView
      ? requireNativeView<NativeSelectedActivityListProps>(
          "AppBlocker",
          "SelectedActivityList"
        )
      : null;

  resolvedNativeView = nativeView;
  return nativeView;
}

export function SelectedActivityList({
  refreshKey,
  selectionCount,
  style,
}: SelectedActivityListProps) {
  if (Platform.OS !== "ios" || selectionCount <= 0) return null;

  const NativeSelectedActivityList = getNativeView();

  if (!NativeSelectedActivityList) {
    return (
      <View
        accessibilityLabel={`${selectionCount} selected ${selectionCount === 1 ? "item" : "items"}`}
        style={[styles.fallback, style]}
      >
        <Text style={styles.fallbackText}>
          {selectionCount} selected {selectionCount === 1 ? "item" : "items"}
        </Text>
      </View>
    );
  }

  return (
    <NativeSelectedActivityList
      refreshKey={refreshKey}
      style={[styles.nativeList, style]}
    />
  );
}

const styles = StyleSheet.create({
  nativeList: {
    width: "100%",
    height: 50,
  },
  fallback: {
    minHeight: 42,
    alignSelf: "flex-start",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#F3F0FF",
  },
  fallbackText: {
    color: "#4F485A",
    fontSize: 14,
    fontWeight: "600",
  },
});
