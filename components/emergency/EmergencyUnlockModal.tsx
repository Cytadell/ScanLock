import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, findNodeHandle, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Props = {
  locked: boolean;
  visible: boolean;
  countdown: number;
  changing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function EmergencyUnlockModal({ locked, visible, countdown, changing, onCancel, onConfirm }: Props) {
  const reduceMotion = useReduceMotion();
  const titleRef = useRef<Text>(null);
  const previousCountdownRef = useRef(countdown);
  const unavailable = countdown > 0 || changing;

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 250);
    return () => clearTimeout(timeout);
  }, [reduceMotion, visible]);

  useEffect(() => {
    if (locked && visible && previousCountdownRef.current > 0 && countdown === 0) {
      AccessibilityInfo.announceForAccessibility("Emergency unlock is now available.");
    }
    previousCountdownRef.current = countdown;
  }, [countdown, locked, visible]);

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <ScrollView
          accessibilityViewIsModal
          style={styles.modal}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.warningIcon, !locked && styles.unlockedIcon]}>
            <MaterialIcons name={locked ? "warning-amber" : "lock-open"} size={30} color={locked ? "#B83F31" : "#6E687A"} />
          </View>
          <Text ref={titleRef} accessibilityRole="header" style={styles.title}>{locked ? "Emergency unlock" : "Already unlocked"}</Text>
          <Text style={styles.description}>
            {locked
              ? "Only use Emergency Unlock if you need to. This will disable app blocking without your ScanLock QR code."
              : "Your apps are currently unlocked. Emergency unlock is not needed."}
          </Text>
          {locked && (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Disables app blocking without scanning your QR key"
              accessibilityLabel={countdown > 0 ? `Emergency unlock available in ${countdown} seconds` : "Confirm emergency unlock"}
              accessibilityState={{ disabled: unavailable }}
              disabled={unavailable}
              onPress={onConfirm}
              style={({ pressed }) => [styles.unlockButton, unavailable && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.unlockButtonText}>
                {changing ? "Unlocking…" : countdown > 0 ? `Wait ${countdown}s` : "Emergency unlock now"}
              </Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: changing }}
            disabled={changing}
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, !locked && styles.unlockedCancelButton, pressed && styles.pressed]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(32, 28, 43, 0.58)" },
  modal: { flexGrow: 0, flexShrink: 1, alignSelf: "center", width: "100%", maxWidth: 390, maxHeight: "90%", borderRadius: 24, backgroundColor: "#FFFFFF", shadowColor: "#201C2B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  content: { alignItems: "center", padding: 24 },
  warningIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EC" },
  unlockedIcon: { backgroundColor: "#F0EFF3" },
  title: { marginTop: 16, color: "#201C2B", fontSize: 24, fontWeight: "800" },
  description: { marginTop: 10, color: "#5F596B", fontSize: 15, lineHeight: 22, textAlign: "center" },
  unlockButton: { width: "100%", minHeight: 52, paddingVertical: 13, marginTop: 24, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#B83F31" },
  unlockButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  cancelButton: { width: "100%", minHeight: 48, paddingVertical: 12, marginTop: 8, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  unlockedCancelButton: { marginTop: 24, backgroundColor: "#F0EFF3" },
  cancelButtonText: { color: "#514A5D", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
