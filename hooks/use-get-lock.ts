import { getOrCreateQrPayload } from "@/services/qrCode";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useGetLock() {
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const qrCardRef = useRef<View>(null);

  useEffect(() => {
    let active = true;

    getOrCreateQrPayload()
      .then((payload) => active && setQrPayload(payload))
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

      const captureUri = await captureRef(qrCardRef, {
        format: "png",
        quality: 1,
      });
      const capturedImage = new File(captureUri);
      const sharedImage = new File(Paths.cache, "your_scanlock.png");

      if (sharedImage.exists) sharedImage.delete();
      capturedImage.copy(sharedImage);

      await Sharing.shareAsync(sharedImage.uri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
        UTI: "public.png",
      });
    } catch (error) {
      console.error("Could not share QR code:", error);
      Alert.alert("Error", "Could not share the QR code.");
    }
  }

  return {
    qrPayload,
    qrCardRef,
    shareQrCode,
  };
}
