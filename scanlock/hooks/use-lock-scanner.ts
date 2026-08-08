import { disableBlocking, enableBlocking, requestAuthorization } from "@/services/appBlocker";
import { getLocked, setLocked } from "@/services/lockStorage";
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

      getLocked()
        .then((savedLocked) => active && setLockedState(savedLocked))
        .catch((error) => console.error("Could not load locked state:", error))
        .finally(() => active && setIsLoading(false));

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
  }, [permission?.granted, requestPermission]);

  const handleBarcodeScanned = useCallback(
    async (_result: BarcodeScanningResult) => {
      if (scanLockRef.current) return;

      scanLockRef.current = true;
      setStatus("verifying");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const nextLocked = !locked;

      try {
        const authorized = await requestAuthorization();
        if (!authorized) {
          throw new Error("App blocking permission is required to update your apps.");
        }

        if (nextLocked) await enableBlocking();
        else await disableBlocking();

        await setLocked(nextLocked);
        setLockedState(nextLocked);
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
