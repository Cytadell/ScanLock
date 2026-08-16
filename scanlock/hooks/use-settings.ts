import {
  getLocked,
  getSelectedAppCount,
  requestAuthorization,
  setBlockingEnabled,
  selectApps,
} from "@/services/appBlocker";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";

export function useSettings() {
  const [selectedAppCount, setSelectedAppCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [debugLockChanging, setDebugLockChanging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getSelectedAppCount()
        .then((count) => active && setSelectedAppCount(count))
        .catch((error) => console.error("Could not load selected app count:", error));

      try {
        setLocked(getLocked());
      } catch (error) {
        console.error("Could not load blocking state:", error);
      }

      return () => {
        active = false;
      };
    }, [])
  );

  async function selectBlockedApps() {
    if (locked) {
      Alert.alert(
        "Unlock Required",
        "Unlock ScanLock before changing the blocked app selection."
      );
      return;
    }

    try {
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert(
          "Permission Required",
          Platform.OS === "android"
            ? "Enable ScanLock app blocking in Accessibility settings, then return to ScanLock."
            : "Screen Time permission is required to select apps."
        );
        return;
      }

      const selection = await selectApps();
      setSelectedAppCount(selection.count);
    } catch (error) {
      console.error("Could not select apps:", error);
      Alert.alert("Error", "Could not open the app selector.");
    }
  }

  function requestEmergencyUnlock() {
    Alert.alert(
      "Emergency Unlock",
      "This will immediately disable the lock state. Are you certain?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlock",
          style: "destructive",
          onPress: performEmergencyUnlock,
        },
      ]
    );
  }

  async function performEmergencyUnlock() {
    try {
      const result = await setBlockingEnabled(false);
      setLocked(result.locked);
      Alert.alert("Unlocked", "QR Brick has been disabled.");
    } catch (error) {
      console.error("Could not emergency unlock:", error);
      Alert.alert("Error", "Could not disable QR Brick.");
    }
  }

  async function toggleDebugLock() {
    if (debugLockChanging) return;

    const nextLocked = !locked;
    if (nextLocked && selectedAppCount === 0) {
      Alert.alert(
        "Choose apps first",
        "Select at least one blocked app before enabling the development lock."
      );
      return;
    }

    setDebugLockChanging(true);
    try {
      if (nextLocked) {
        const authorized = await requestAuthorization();
        if (!authorized) {
          Alert.alert(
            "Permission Required",
            Platform.OS === "android"
              ? "Enable ScanLock app blocking in Accessibility settings, then try again."
              : "Screen Time permission is required to block apps."
          );
          return;
        }
      }

      const result = await setBlockingEnabled(nextLocked);
      setLocked(result.locked);
    } catch (error) {
      console.error("Could not toggle the development lock:", error);
      Alert.alert(
        "Debug lock failed",
        error instanceof Error ? error.message : "Could not change the blocking state."
      );
    } finally {
      setDebugLockChanging(false);
    }
  }

  return {
    selectedAppCount,
    locked,
    debugLockChanging,
    selectBlockedApps,
    requestEmergencyUnlock,
    toggleDebugLock,
  };
}
