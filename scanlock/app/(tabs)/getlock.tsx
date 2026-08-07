import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    StyleSheet,
    Text,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";

const QR_ID_KEY = "qr-brick:qrId";

export default function HomeScreen() {
  const [qrId, setQrId] = useState<string | null>(null);
  const qrCardRef = useRef<View>(null);

  useEffect(() => {
    async function loadOrCreateQrId() {
      try {
        let savedId = await AsyncStorage.getItem(QR_ID_KEY);

        if (savedId === null) {
          savedId = generateQrId();
          await AsyncStorage.setItem(QR_ID_KEY, savedId);
        }

        setQrId(savedId);
      } catch (error) {
        console.error("Could not load QR ID:", error);
      }
    }

    loadOrCreateQrId();
  }, []);

  function generateQrId() {
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).substring(2)
    );
  }

  async function shareQrCode() {
    if (!qrCardRef.current) {
      return;
    }

    try {
      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1,
      });

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Sharing unavailable");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
      });
    } catch (error) {
      console.error("Could not share QR code:", error);
      Alert.alert("Error", "Could not share the QR code.");
    }
  }

  if (qrId === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Here is your QR code</Text>

      <View
        ref={qrCardRef}
        collapsable={false}
        style={styles.qrCard}
      >
        <Text style={styles.qrTitle}>Your Lock QR Code</Text>

        <QRCode
          value={qrId}
          size={250}
        />

        <Text style={styles.instructions}>
          Keep this QR code somewhere away from your phone.
        </Text>
      </View>

      <Button
        title="Print / Share"
        onPress={shareQrCode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  qrCard: {
    backgroundColor: "white",
    padding: 30,
    alignItems: "center",
    gap: 20,
  },

  qrTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },

  instructions: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    maxWidth: 250,
  },
});