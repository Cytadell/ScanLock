import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { disableBlocking, enableBlocking, requestAuthorization } from "@/services/appBlocker";
import { getLocked, setLocked } from "@/services/lockStorage";

export default function HomeScreen() {
  // Local React/UI state.
  const [locked, setLockedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Controls whether the camera screen is visible.
  const [isScanning, setIsScanning] = useState(false);

  // Prevents the same QR code from firing repeatedly.
  const scanLockRef = useRef(false);

  // Stores the most recently scanned QR ID.
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();

  // Whenever this tab comes into focus, reload the persistent
  // lock value and copy it into the local UI state.
  useFocusEffect(
    useCallback(() => {
      async function loadLockedState() {
        try {
          const savedLocked = await getLocked();

          setLockedState(savedLocked);
        } catch (error) {
          console.error("Could not load locked state:", error);
        } finally {
          setIsLoading(false);
        }
      }

      loadLockedState();
    }, [])
  );

  // Save to persistent storage and then update the local UI.
async function saveLockedState(newValue: boolean) {
  try {
    const authorized = await requestAuthorization();

    if (!authorized) {
      Alert.alert(
        "Permission Required",
        "App blocking permission is required before QR Brick can lock apps."
      );
      return;
    }
    
    if (newValue) {
      await enableBlocking();
    } else {
      await disableBlocking();
    }

    await setLocked(newValue);
    setLockedState(newValue);
  } catch (error) {
    console.error("Could not change lock state:", error);
    Alert.alert("Error", "Could not change the lock state.");
  }
}

  async function openScanner() {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          "Camera permission required",
          "Camera access is needed to scan QR codes."
        );
        return;
      }
    }

    scanLockRef.current = false;
    setIsScanning(true);
  }

  async function handleQrScanned(result: BarcodeScanningResult) {
    // useRef updates immediately, so duplicate scan events are ignored.
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;

    const qrId = result.data;

    console.log("Scanned QR ID:", qrId);

    setLastScannedId(qrId);
    setIsScanning(false);

    const newLockedValue = !locked;

    await saveLockedState(newLockedValue);

    Alert.alert(
      newLockedValue ? "Locked" : "Unlocked",
      `QR ID: ${qrId}`
    );
  }

  function cancelScanner() {
    scanLockRef.current = true;
    setIsScanning(false);
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isScanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={handleQrScanned}
        />

        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerTitle}>Scan a QR code</Text>

          <View style={styles.scanFrame} />

          <Pressable
            style={styles.cancelButton}
            onPress={cancelScanner}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {locked
          ? "Now Locked\nScan to Unlock"
          : "Now Unlocked\nScan to Lock"}
      </Text>

      <Button
        title="Scan"
        onPress={openScanner}
      />

      {lastScannedId !== null && (
        <Text style={styles.scannedText}>
          Last scanned ID: {lastScannedId}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  scannedText: {
    fontSize: 14,
    textAlign: "center",
  },

  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
  },

  scannerOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 50,
  },

  scannerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "white",
    borderRadius: 16,
  },

  cancelButton: {
    backgroundColor: "white",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },

  cancelButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "600",
  },
});