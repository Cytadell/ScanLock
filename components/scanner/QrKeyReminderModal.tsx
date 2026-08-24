import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Props = {
  visible: boolean;
  confirming: boolean;
  onGetLock: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function QrKeyReminderModal({
  visible,
  confirming,
  onGetLock,
  onConfirm,
  onDismiss,
}: Props) {
  const reduceMotion = useReduceMotion();
  const titleRef = useRef<Text>(null);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 250);
    return () => clearTimeout(timeout);
  }, [reduceMotion, visible]);

  const dismiss = () => {
    if (!confirming) onDismiss();
  };

  return (
    <Modal
      animationType={reduceMotion ? "none" : "fade"}
      testID="qr-key-reminder-modal"
      transparent
      visible={visible}
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        <ScrollView
          accessibilityViewIsModal
          style={styles.modal}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.closeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close QR key reminder"
              accessibilityState={{ disabled: confirming }}
              disabled={confirming}
              hitSlop={8}
              onPress={dismiss}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <MaterialIcons name="close" size={23} color="#514A5D" />
            </Pressable>
          </View>

          <View style={styles.keyIcon}>
            <MaterialIcons name="qr-code-2" size={31} color="#7057E8" />
          </View>
          <Text ref={titleRef} accessibilityRole="header" style={styles.title}>
            Have your QR key ready?
          </Text>
          <Text style={styles.description}>
            You’ll need a <Text style={styles.underlined}>printed copy of your ScanLock QR key</Text> to unlock your apps again. Print it before starting your focus session.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: confirming }}
            disabled={confirming}
            onPress={onGetLock}
            style={({ pressed }) => [styles.getLockButton, confirming && styles.disabled, pressed && styles.pressed]}
          >
            <MaterialIcons name="print" size={21} color="#FFFFFF" />
            <Text style={styles.getLockButtonText}>Get Lock</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: confirming, disabled: confirming }}
            disabled={confirming}
            onPress={onConfirm}
            style={({ pressed }) => [styles.confirmButton, confirming && styles.disabled, pressed && styles.pressed]}
          >
            {confirming ? (
              <ActivityIndicator color="#7057E8" />
            ) : (
              <Text style={styles.confirmButtonText}>I already have it</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(32, 28, 43, 0.58)" },
  modal: { flexGrow: 0, flexShrink: 1, alignSelf: "center", width: "100%", maxWidth: 390, maxHeight: "90%", borderRadius: 24, backgroundColor: "#FFFFFF", shadowColor: "#201C2B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  content: { alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 },
  closeRow: { width: "100%", alignItems: "flex-end", paddingTop: 16 },
  closeButton: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F1F7" },
  keyIcon: { width: 62, height: 62, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EFECFF" },
  title: { marginTop: 16, color: "#201C2B", fontSize: 24, fontWeight: "800", textAlign: "center" },
  description: { marginTop: 10, color: "#5F596B", fontSize: 15, lineHeight: 22, textAlign: "center" },
  underlined: { textDecorationLine: "underline" },
  getLockButton: { width: "100%", minHeight: 54, marginTop: 24, paddingHorizontal: 18, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, backgroundColor: "#7057E8" },
  getLockButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  confirmButton: { width: "100%", minHeight: 50, marginTop: 10, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#D8D2E6" },
  confirmButtonText: { color: "#5F46D1", fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
