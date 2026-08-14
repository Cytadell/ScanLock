import {
  getLocked,
  isAuthorized,
  requestAuthorization,
  setBlockingEnabled,
} from "@/services/appBlocker";
import { validateQrPayload } from "@/services/qrCode";
import { BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export type ScanStatus =
  | "requesting-permission"
  | "permission-denied"
  | "scanning"
  | "verifying"
  | "success"
  | "invalid-code"
  | "error";

export function useLockScanner() {
  const [locked, setLockedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const scanLockRef = useRef(false);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      try {
        if (active) setLockedState(getLocked());
      } catch (error) {
        console.error("Could not load locked state:", error);
      } finally {
        if (active) setIsLoading(false);
      }

      return () => {
        active = false;
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      };
    }, [])
  );

  const close = useCallback(() => {
    scanLockRef.current = true;
    setTorchEnabled(false);
    setIsOpen(false);
  }, []);

  const open = useCallback(async () => {
    scanLockRef.current = false;
    setErrorMessage(undefined);
    setTorchEnabled(false);

    if (!locked) {
      try {
        const authorized = isAuthorized() || (await requestAuthorization());
        if (!authorized) return;
      } catch (error) {
        console.error("Could not request app blocking permission:", error);
        return;
      }
    }

    setIsOpen(true);

    if (!permission?.granted) {
      setStatus("requesting-permission");
      const result = await requestPermission();
      if (!result.granted) {
        setStatus("permission-denied");
        return;
      }
    }

    setStatus("scanning");
  }, [locked, permission?.granted, requestPermission]);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanLockRef.current) return;

      scanLockRef.current = true;
      setStatus("verifying");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const isValid = await validateQrPayload(result.data);
        if (!isValid) {
          setStatus("invalid-code");
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      } catch (error) {
        console.error("Could not validate QR code:", error);
        setErrorMessage("We couldn’t verify this QR code. Please try again.");
        setStatus("error");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const nextLocked = !locked;

      try {
        if (nextLocked) {
          const authorized = await requestAuthorization();
          if (!authorized) {
            throw new Error("App blocking permission is required to update your apps.");
          }
        }

        const result = await setBlockingEnabled(nextLocked);
        if (result.locked !== nextLocked) {
          throw new Error("The blocking state could not be verified.");
        }

        setLockedState(result.locked);
        setStatus("success");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        completionTimerRef.current = setTimeout(close, 1250);
      } catch (error) {
        console.error("Could not change lock state:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "We couldn’t update your apps. Please try again."
        );
        setStatus("error");
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [close, locked]
  );

  const retry = useCallback(() => {
    scanLockRef.current = false;
    setErrorMessage(undefined);
    setStatus("scanning");
  }, []);

  const toggleTorch = useCallback(() => {
    setTorchEnabled((current) => !current);
    void Haptics.selectionAsync();
  }, []);

  return {
    locked,
    isLoading,
    isOpen,
    status,
    torchEnabled,
    errorMessage,
    open,
    close,
    retry,
    toggleTorch,
    handleBarcodeScanned,
  };
}
