import {
  disableBlocking,
  getSelectedAppCount,
  requestAuthorization,
  selectApps,
} from "@/services/appBlocker";
import { setLocked } from "@/services/lockStorage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export function useSettings() {
  const [selectedAppCount, setSelectedAppCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getSelectedAppCount()
        .then((count) => active && setSelectedAppCount(count))
        .catch((error) => console.error("Could not load selected app count:", error));

      return () => {
        active = false;
      };
    }, [])
  );

  async function selectBlockedApps() {
    try {
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert(
          "Permission Required",
          "Screen Time permission is required to select apps."
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
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert(
          "Permission Required",
          "Screen Time permission is required to disable app blocking."
        );
        return;
      }

      await disableBlocking();
      await setLocked(false);
      Alert.alert("Unlocked", "QR Brick has been disabled.");
    } catch (error) {
      console.error("Could not emergency unlock:", error);
      Alert.alert("Error", "Could not disable QR Brick.");
    }
  }

  return {
    selectedAppCount,
    selectBlockedApps,
    requestEmergencyUnlock,
  };
}
