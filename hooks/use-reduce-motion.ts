import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReduceMotion() {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotionEnabled(enabled);
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled
    );

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotionEnabled;
}
