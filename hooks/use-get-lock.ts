import { getOrCreateQrPayload } from "@/services/qrCode";
import { markQrKeyReady } from "@/services/qrKeyReadiness";
import {
  getFoldableCardHtml,
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
  const [foldablePreviewHtml, setFoldablePreviewHtml] = useState<string | null>(null);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
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

  const captureQrCard = () => {
    if (!qrCardRef.current) {
      return Promise.reject(new Error("The QR key is not ready to capture."));
    }

    return captureRef(qrCardRef, {
      format: "png",
      quality: 1,
    });
  };

  async function prepareFoldablePreview() {
    if (!qrPayload || foldablePreviewHtml || isPreparingPreview) return;

    setIsPreparingPreview(true);
    setPreviewError(null);
    try {
      const html = await getFoldableCardHtml(qrPayload, captureQrCard);
      setFoldablePreviewHtml(html);
    } catch (error) {
      console.error("Could not prepare foldable card preview:", error);
      setPreviewError("The foldable card preview could not be prepared.");
    } finally {
      setIsPreparingPreview(false);
    }
  }

  async function shareQrCode(format: "foldable" | "png") {
    if (!qrCardRef.current || !qrPayload || isSharing) return;

    setIsSharing(true);
    try {
      try {
        await markQrKeyReady();
      } catch (error) {
        console.error("Could not save QR key readiness:", error);
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

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
    foldablePreviewHtml,
    isPreparingPreview,
    previewError,
    isSharing,
    prepareFoldablePreview,
    shareQrCode,
  };
}
