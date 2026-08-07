import {
  disableBlocking,
  getSelectedAppCount,
  requestAuthorization,
  selectApps,
} from "@/services/appBlocker";

import { setLocked } from "@/services/lockStorage";

import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";


export default function SettingsScreen() {

  const [selectedAppCount, setSelectedAppCount] = useState(0);

  useEffect(() => {
    async function loadSelectedAppCount() {
      const count = await getSelectedAppCount();
      setSelectedAppCount(count);
    }

    loadSelectedAppCount();
  }, []);

  async function handleSelectApps() {
    try {
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert(
          "Permission Required",
          "Screen Time permission is required to select apps."
        );
        return;
      }

      await selectApps();
    } catch (error) {
      console.error("Could not select apps:", error);

      Alert.alert(
        "Error",
        "Could not open the app selector."
      );
    }
  }

  async function emergencyUnlock() {
    try {
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert(
          "Permission Required",
          "Screen Time permission is required to disable app blocking."
        );
        return;
      }

      Alert.alert(
        "Emergency Unlock",
        "This will immediately disable the lock state. Are you certain?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Unlock",
            style: "destructive",
            onPress: async () => {
              try {
                // First disable the actual native app blocking.
                await disableBlocking();

                // Only mark the app as unlocked after blocking is disabled.
                await setLocked(false);

                Alert.alert(
                  "Unlocked",
                  "QR Brick has been disabled."
                );
              } catch (error) {
                console.error(
                  "Could not emergency unlock:",
                  error
                );

                Alert.alert(
                  "Error",
                  "Could not disable QR Brick."
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Could not request authorization:",
        error
      );

      Alert.alert(
        "Error",
        "Could not request Screen Time permission."
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Blocked Apps
        </Text>

        <Text style={styles.description}>
          Choose which apps should be blocked when Scan Lock is active.
        </Text>

        <Pressable
          style={styles.button}
          onPress={handleSelectApps}
        >
          <Text style={styles.buttonText}>
            Select Apps
          </Text>
        </Pressable>

        <Text style={styles.smallText}>
          {selectedAppCount} apps selected
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Emergency Access
        </Text>

        <Text style={styles.description}>
          Immediately disable blocking if you lose access to your QR code.
        </Text>

        <Pressable
          style={styles.dangerButton}
          onPress={emergencyUnlock}
        >
          <Text style={styles.dangerButtonText}>
            Emergency Unlock
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 70,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
  },

  section: {
    marginBottom: 36,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    marginBottom: 16,
    lineHeight: 21,
  },

  button: {
    backgroundColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  smallText: {
    marginTop: 10,
    fontSize: 14,
  },

  dangerButton: {
    borderWidth: 1,
    borderColor: "red",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  dangerButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "600",
  },
});