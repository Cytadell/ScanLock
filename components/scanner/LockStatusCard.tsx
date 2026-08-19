import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, findNodeHandle, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PadlockQrCodeIcon } from "@/components/icons/PadlockQrCodeIcon";
import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Props = {
  locked: boolean;
  lockElapsed: string;
  onScan: () => void;
};

export function LockStatusCard({ locked, lockElapsed, onScan }: Props) {
  const [helpVisible, setHelpVisible] = useState(false);
  const helpButtonRef = useRef<View>(null);
  const helpTitleRef = useRef<Text>(null);
  const wasHelpVisibleRef = useRef(false);
  const reduceMotion = useReduceMotion();
  const accent = locked ? "#B83F31" : "#08785A";
  const tint = locked ? "#FFF0EC" : "#E9F8F3";

  // Copy and paste an item here to add another help bubble.
  const helpItems = [
    {
      title: "Choose the apps you want to block",
      body: "Open the Settings tab, tap Choose apps, and select the apps you want ScanLock to protect.",
      icon: "apps" as const,
    },
    {
      title: "Scan to start focusing",
      body: "From the Home tab, tap Scan to lock and point your camera at your ScanLock QR code.",
      icon: "qr-code-scanner" as const,
    },
    {
      title: "Scan again when you are done",
      body: "Use the same QR code to unlock your selected apps and end your focus session.",
      icon: "lock-open" as const,
    },
  ];

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onScan();
  }

  useEffect(() => {
    const wasVisible = wasHelpVisibleRef.current;
    wasHelpVisibleRef.current = helpVisible;
    if (!helpVisible && !wasVisible) return;
    const timeout = setTimeout(() => {
      const target = helpVisible ? helpTitleRef.current : helpButtonRef.current;
      const node = findNodeHandle(target);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 350);
    return () => clearTimeout(timeout);
  }, [helpVisible, reduceMotion]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.container}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.screenScroll}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View accessible={false} style={styles.brandMark}>
              <PadlockQrCodeIcon color="#FFFFFF" height={27} />
            </View>
            <Text style={styles.brand}>ScanLock</Text>
          </View>
          <Pressable
            ref={helpButtonRef}
            accessibilityRole="button"
            accessibilityLabel="Open help"
            accessibilityHint="Shows instructions for using ScanLock"
            hitSlop={8}
            onPress={() => setHelpVisible(true)}
            style={({ pressed }) => [styles.helpButton, pressed && styles.iconButtonPressed]}
          >
            <MaterialIcons name="question-mark" size={23} color="#7057E8" />
          </Pressable>
        </View>

        <View accessible={false} style={[styles.glow, { backgroundColor: tint }]} />

        <View style={styles.content}>
          <View accessible={false} style={[styles.lockCircle, { backgroundColor: tint }]}>
            <View style={[styles.lockCircleInner, { backgroundColor: accent }]}>
              <MaterialIcons
                name={locked ? "lock" : "lock-open"}
                size={48}
                color="#FFFFFF"
              />
            </View>
          </View>

          <View style={[styles.statusPill, { backgroundColor: tint }]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusText, { color: accent }]}>
              APPS {locked ? "LOCKED" : "UNLOCKED"}
            </Text>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            Your apps are {locked ? "locked" : "available"}
          </Text>
          <Text style={styles.subtitle}>
            {locked
              ? "Scan a QR code when you’re ready to get access again."
              : "Ready to focus? Scan a QR code to block your selected apps."}
          </Text>
          {locked && (
            <View
              accessible
              accessibilityLabel={`Apps have been locked for ${lockElapsed}`}
              style={styles.timer}
            >
              <Text style={styles.timerLabel}>LOCKED FOR</Text>
              <Text style={styles.timerValue}>{lockElapsed}</Text>
              <Text style={styles.timerUnits}>HOURS       MINUTES       SECONDS</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Scan a QR code to ${locked ? "unlock" : "lock"} apps`}
            onPress={handlePress}
            style={({ pressed }) => [styles.scanButton, pressed && styles.scanButtonPressed]}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
            <Text style={styles.scanButtonText}>Scan to {locked ? "unlock" : "lock"}</Text>
            <MaterialIcons name="arrow-forward" size={21} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType={reduceMotion ? "none" : "slide"}
        transparent
        visible={helpVisible}
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessible={false}
            style={styles.backdrop}
            onPress={() => setHelpVisible(false)}
          />
          <SafeAreaView accessibilityViewIsModal style={styles.helpSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.helpHeader}>
              <View style={styles.helpHeaderCopy}>
                <Text style={styles.helpEyebrow}>HOW IT WORKS</Text>
                <Text ref={helpTitleRef} accessibilityRole="header" style={styles.helpTitle}>ScanLock help</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close help"
                hitSlop={8}
                onPress={() => setHelpVisible(false)}
                style={({ pressed }) => [styles.closeButton, pressed && styles.iconButtonPressed]}
              >
                <MaterialIcons name="close" size={24} color="#201C2B" />
              </Pressable>
            </View>
            <Text style={styles.helpSubtitle}>A quick guide to locking and unlocking your apps.</Text>

            <ScrollView
              contentContainerStyle={styles.helpList}
              showsVerticalScrollIndicator={false}
            >
              {helpItems.map((item, index) => (
                <View key={item.title} style={styles.helpBubble}>
                  <View style={styles.helpBubbleIcon}>
                    <MaterialIcons name={item.icon} size={24} color="#7057E8" />
                  </View>
                  <View style={styles.helpBubbleCopy}>
                    <Text style={styles.helpBubbleNumber}>STEP {index + 1}</Text>
                    <Text style={styles.helpBubbleTitle}>{item.title}</Text>
                    <Text style={styles.helpBubbleBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  screenScroll: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22, overflow: "hidden" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#7057E8" },
  brand: { color: "#201C2B", fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  helpButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#EFECFF", borderWidth: 1, borderColor: "#E2DCF9" },
  iconButtonPressed: { opacity: 0.72 },
  glow: { position: "absolute", width: 420, height: 420, borderRadius: 210, top: 90, alignSelf: "center", opacity: 0.75 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 18 },
  lockCircle: { width: 178, height: 178, borderRadius: 89, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  lockCircleInner: { width: 126, height: 126, borderRadius: 63, alignItems: "center", justifyContent: "center", shadowColor: "#16121F", shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, marginBottom: 16 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#201C2B", fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1, textAlign: "center", maxWidth: 330 },
  subtitle: { color: "#5F596B", fontSize: 16, lineHeight: 24, textAlign: "center", maxWidth: 330, marginTop: 12 },
  timer: { alignItems: "center", marginTop: 22, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18, backgroundColor: "rgba(255, 255, 255, 0.8)", borderWidth: 1, borderColor: "#F2DAD4" },
  timerLabel: { color: "#B83F31", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  timerValue: { color: "#201C2B", fontSize: 32, lineHeight: 39, fontWeight: "800", letterSpacing: 2, fontVariant: ["tabular-nums"], marginTop: 2 },
  timerUnits: { color: "#625D6F", fontSize: 9, fontWeight: "700", letterSpacing: 0.7 },
  footer: { gap: 16 },
  scanButton: { minHeight: 58, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8", shadowColor: "#7057E8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  scanButtonPressed: { opacity: 0.82 },
  scanButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  secureRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  secureText: { flexShrink: 1, color: "#625D6F", fontSize: 12, textAlign: "center" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(32, 28, 43, 0.38)" },
  helpSheet: { height: "82%", backgroundColor: "#F8F7FC", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, shadowColor: "#201C2B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 16 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: "center", backgroundColor: "#D8D3E2", marginBottom: 14 },
  helpHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 },
  helpHeaderCopy: { flex: 1, paddingRight: 16 },
  helpEyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 3 },
  helpTitle: { color: "#201C2B", fontSize: 30, fontWeight: "800", letterSpacing: -0.8 },
  closeButton: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECE9F2" },
  helpSubtitle: { color: "#6E687A", fontSize: 15, lineHeight: 22, marginTop: 10, paddingHorizontal: 24 },
  helpList: { gap: 14, paddingHorizontal: 24, paddingTop: 22, paddingBottom: 34 },
  helpBubble: { flexDirection: "row", gap: 14, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#ECE9F2", shadowColor: "#251D4C", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  helpBubbleIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#EFECFF" },
  helpBubbleCopy: { flex: 1 },
  helpBubbleNumber: { color: "#7057E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4 },
  helpBubbleTitle: { color: "#201C2B", fontSize: 17, lineHeight: 22, fontWeight: "800" },
  helpBubbleBody: { color: "#5F596B", fontSize: 14, lineHeight: 21, marginTop: 6 },
});
