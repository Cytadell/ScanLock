import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, ActivityIndicator, findNodeHandle, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Props = {
  visible: boolean;
  choosing: boolean;
  onChooseApps: () => void;
  onDismiss: () => void;
};

export function ChooseAppsFirstModal({ visible, choosing, onChooseApps, onDismiss }: Props) {
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

  return (
    <Modal animationType={reduceMotion ? "none" : "fade"} transparent visible={visible} onRequestClose={() => !choosing && onDismiss()}>
      <View style={styles.backdrop}>
        <ScrollView
          accessibilityViewIsModal
          style={styles.modal}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warningIcon}>
            <MaterialIcons name="warning-amber" size={30} color="#B83F31" />
          </View>
          <Text ref={titleRef} accessibilityRole="header" style={styles.title}>Choose apps first</Text>
          <Text style={styles.description}>Open the Settings tab and select at least one app, category, or website before locking.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: choosing, busy: choosing }}
            disabled={choosing}
            onPress={onChooseApps}
            style={({ pressed }) => [styles.chooseButton, choosing && styles.disabled, pressed && styles.pressed]}
          >
            {choosing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.chooseButtonText}>Choose apps</Text>}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: choosing }}
            disabled={choosing}
            onPress={onDismiss}
            style={({ pressed }) => [styles.laterButton, pressed && styles.pressed]}
          >
            <Text style={styles.laterButtonText}>Not now</Text>
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
  title: { marginTop: 16, color: "#201C2B", fontSize: 24, fontWeight: "800" },
  description: { marginTop: 10, color: "#5F596B", fontSize: 15, lineHeight: 22, textAlign: "center" },
  chooseButton: { width: "100%", minHeight: 52, paddingVertical: 13, marginTop: 24, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#7057E8" },
  chooseButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  laterButton: { width: "100%", minHeight: 48, paddingVertical: 12, marginTop: 8, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  laterButtonText: { color: "#514A5D", fontSize: 15, fontWeight: "700" },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
