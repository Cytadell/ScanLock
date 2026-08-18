import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const LOCKED_AT_KEY = "@scanlock/locked-at";

function getElapsedSeconds(lockedAt: number | null) {
  if (lockedAt === null) return 0;
  return Math.max(0, Math.floor((Date.now() - lockedAt) / 1000));
}

export function formatLockDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function useLockTimer() {
  const [lockedAt, setLockedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const syncWithLockState = useCallback(async (locked: boolean) => {
    if (!locked) {
      await AsyncStorage.removeItem(LOCKED_AT_KEY);
      setLockedAt(null);
      setElapsedSeconds(0);
      return;
    }

    const savedValue = await AsyncStorage.getItem(LOCKED_AT_KEY);
    const savedTimestamp = savedValue === null ? NaN : Number(savedValue);
    const nextLockedAt = Number.isFinite(savedTimestamp) ? savedTimestamp : Date.now();

    if (!Number.isFinite(savedTimestamp)) {
      await AsyncStorage.setItem(LOCKED_AT_KEY, String(nextLockedAt));
    }

    setLockedAt(nextLockedAt);
    setElapsedSeconds(getElapsedSeconds(nextLockedAt));
  }, []);

  const start = useCallback(async () => {
    const now = Date.now();
    await AsyncStorage.setItem(LOCKED_AT_KEY, String(now));
    setLockedAt(now);
    setElapsedSeconds(0);
  }, []);

  const stop = useCallback(async () => {
    await AsyncStorage.removeItem(LOCKED_AT_KEY);
    setLockedAt(null);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    if (lockedAt === null) return;

    const updateElapsed = () => setElapsedSeconds(getElapsedSeconds(lockedAt));
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [lockedAt]);

  return {
    elapsedSeconds,
    formattedElapsed: formatLockDuration(elapsedSeconds),
    syncWithLockState,
    start,
    stop,
  };
}
