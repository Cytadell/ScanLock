import {
  getLocked,
  hasSelection,
  isAuthorized,
  requestAuthorization,
  selectApps,
  setBlockingEnabled,
} from "@/services/appBlocker";
import { validateQrPayload } from "@/services/qrCode";
import { hasQrKeyReady, markQrKeyReady } from "@/services/qrKeyReadiness";
import { BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { useLockTimer } from "./use-lock-timer";

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
  const [hasSelectedApps, setHasSelectedApps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [chooseAppsFirstVisible, setChooseAppsFirstVisible] = useState(false);
  const [isChoosingApps, setIsChoosingApps] = useState(false);
  const [qrKeyReminderVisible, setQrKeyReminderVisible] = useState(false);
  const [isConfirmingQrKey, setIsConfirmingQrKey] = useState(false);
  const [emergencyUnlockVisible, setEmergencyUnlockVisible] = useState(false);
  const [emergencyUnlockCountdown, setEmergencyUnlockCountdown] = useState(10);
  const [emergencyUnlockChanging, setEmergencyUnlockChanging] = useState(false);
  const scanLockRef = useRef(false);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const lockTimer = useLockTimer();

  const dismissChooseAppsFirst = useCallback(() => setChooseAppsFirstVisible(false), []);
  const dismissQrKeyReminder = useCallback(() => setQrKeyReminderVisible(false), []);

  const chooseAppsFromPrompt = useCallback(async () => {
    if (isChoosingApps) return;
    setIsChoosingApps(true);
    try {
      const authorized = await requestAuthorization();
      if (!authorized) {
        Alert.alert(
          "Permission Required",
          Platform.OS === "android"
            ? "Enable ScanLock app blocking in Accessibility settings, then return to ScanLock."
            : "Screen Time permission is required to select apps."
        );
        return;
      }

      const selection = await selectApps();
      setHasSelectedApps(selection.count > 0);
      setChooseAppsFirstVisible(false);
    } catch (error) {
      console.error("Could not select apps:", error);
      Alert.alert("Error", "Could not open the app selector.");
    } finally {
      setIsChoosingApps(false);
    }
  }, [isChoosingApps]);

  useEffect(() => {
    if (!emergencyUnlockVisible || emergencyUnlockCountdown === 0) return;
    const timer = setTimeout(
      () => setEmergencyUnlockCountdown((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => clearTimeout(timer);
  }, [emergencyUnlockCountdown, emergencyUnlockVisible]);

  const requestEmergencyUnlock = useCallback(() => {
    if (locked) setEmergencyUnlockCountdown(10);
    setEmergencyUnlockVisible(true);
  }, [locked]);

  const cancelEmergencyUnlock = useCallback(() => {
    if (!emergencyUnlockChanging) setEmergencyUnlockVisible(false);
  }, [emergencyUnlockChanging]);

  const performEmergencyUnlock = useCallback(async () => {
    if (emergencyUnlockCountdown > 0 || emergencyUnlockChanging) return;
    setEmergencyUnlockChanging(true);
    try {
      const result = await setBlockingEnabled(false);
      setLockedState(result.locked);
      await lockTimer.stop();
      setEmergencyUnlockVisible(false);
      Alert.alert("Unlocked", "App blocking has been disabled.");
    } catch (error) {
      console.error("Could not emergency unlock:", error);
      Alert.alert("Error", "Could not disable app blocking.");
    } finally {
      setEmergencyUnlockChanging(false);
    }
  }, [emergencyUnlockChanging, emergencyUnlockCountdown, lockTimer.stop]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      try {
        const nextLocked = getLocked();
        if (active) {
          setLockedState(nextLocked);
          setHasSelectedApps(hasSelection());
          void lockTimer.syncWithLockState(nextLocked).catch((error) => {
            console.error("Could not load lock timer:", error);
          });
        }
      } catch (error) {
        console.error("Could not load locked state:", error);
      } finally {
        if (active) setIsLoading(false);
      }

      return () => {
        active = false;
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      };
    }, [lockTimer.syncWithLockState])
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
        if (!hasSelection()) {
          setChooseAppsFirstVisible(true);
          return;
        }

        let qrKeyReady = false;
        try {
          qrKeyReady = await hasQrKeyReady();
        } catch (error) {
          console.error("Could not load QR key readiness:", error);
        }

        if (!qrKeyReady) {
          setQrKeyReminderVisible(true);
          return;
        }

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

  const confirmQrKeyAndOpen = useCallback(async () => {
    if (isConfirmingQrKey) return;

    setIsConfirmingQrKey(true);
    setQrKeyReminderVisible(false);
    try {
      try {
        await markQrKeyReady();
      } catch (error) {
        console.error("Could not save QR key readiness:", error);
      }
      await open();
    } finally {
      setIsConfirmingQrKey(false);
    }
  }, [isConfirmingQrKey, open]);

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
            throw new Error(
              Platform.OS === "android"
                ? "Enable ScanLock app blocking in Accessibility settings before locking apps."
                : "App blocking permission is required to update your apps."
            );
          }
        }

        const result = await setBlockingEnabled(nextLocked);
        if (result.locked !== nextLocked) {
          throw new Error("The blocking state could not be verified.");
        }

        setLockedState(result.locked);
        const updateTimer = result.locked ? lockTimer.start : lockTimer.stop;
        void updateTimer().catch((error) => {
          console.error("Could not update lock timer:", error);
        });
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
    [close, lockTimer.start, lockTimer.stop, locked]
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
    hasSelectedApps,
    lockElapsed: lockTimer.formattedElapsed,
    isLoading,
    isOpen,
    status,
    torchEnabled,
    errorMessage,
    chooseAppsFirstVisible,
    isChoosingApps,
    chooseAppsFromPrompt,
    dismissChooseAppsFirst,
    qrKeyReminderVisible,
    isConfirmingQrKey,
    confirmQrKeyAndOpen,
    dismissQrKeyReminder,
    emergencyUnlockVisible,
    emergencyUnlockCountdown,
    emergencyUnlockChanging,
    requestEmergencyUnlock,
    cancelEmergencyUnlock,
    performEmergencyUnlock,
    open,
    close,
    retry,
    toggleTorch,
    handleBarcodeScanned,
  };
}
