import { getOrCreateQrId } from "@/services/qrCode";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useGetLock() {
  const [qrId, setQrId] = useState<string | null>(null);
  const qrCardRef = useRef<View>(null);

  useEffect(() => {
    let active = true;

    getOrCreateQrId()
      .then((id) => active && setQrId(id))
      .catch((error) => {
        console.error("Could not load QR ID:", error);
        Alert.alert("Error", "Could not prepare your QR code.");
      });

    return () => {
      active = false;
    };
  }, []);

  async function shareQrCode() {
    if (!qrCardRef.current) return;

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

      const uri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
      });
    } catch (error) {
      console.error("Could not share QR code:", error);
      Alert.alert("Error", "Could not share the QR code.");
    }
  }

  return {
    qrId,
    qrCardRef,
    shareQrCode,
  };
}
