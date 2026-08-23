import { getOrCreateQrPayload } from "@/services/qrCode";
import {
  getOrCreateFoldableExport,
  getOrCreatePngExport,
} from "@/services/scanLockExport";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useGetLock() {
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
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

  async function shareQrCode(format: "foldable" | "png") {
    if (!qrCardRef.current || !qrPayload || isSharing) return;

    setIsSharing(true);
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

      const captureQrCard = () =>
        captureRef(qrCardRef, {
          format: "png",
          quality: 1,
        });

      if (format === "foldable") {
        const foldablePdf = await getOrCreateFoldableExport(qrPayload, captureQrCard);

        await Sharing.shareAsync(foldablePdf.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Print or Share ScanLock Foldable Card",
          UTI: "com.adobe.pdf",
        });
        return;
      }

      const sharedImage = await getOrCreatePngExport(qrPayload, captureQrCard);

      await Sharing.shareAsync(sharedImage.uri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
        UTI: "public.png",
      });
    } catch (error) {
      console.error("Could not share QR code:", error);
      Alert.alert("Error", "Could not share the QR code.");
    } finally {
      setIsSharing(false);
    }
  }

  return {
    qrPayload,
    qrCardRef,
    isSharing,
    shareQrCode,
  };
}
