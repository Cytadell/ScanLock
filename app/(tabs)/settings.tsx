import { useOnboardingReplay } from "@/hooks/use-onboarding-replay";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { useSettings } from "@/hooks/use-settings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  findNodeHandle,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_SCANLOCK_PRIVACY_URL?.trim();
const SUPPORT_URL = process.env.EXPO_PUBLIC_SCANLOCK_SUPPORT_URL?.trim();
const LEGAL_LINKS_CONFIGURED = Boolean(PRIVACY_POLICY_URL && SUPPORT_URL);

function openConfiguredUrl(url: string | undefined) {
  if (url) void Linking.openURL(url);
}

export default function SettingsScreen() {
  const {
    selectedAppCount,
    locked,
    debugLockChanging,
    emergencyUnlockVisible,
    emergencyUnlockCountdown,
    emergencyUnlockChanging,
    selectBlockedApps,
    requestEmergencyUnlock,
    cancelEmergencyUnlock,
    performEmergencyUnlock,
    toggleDebugLock,
  } = useSettings();
  const replayOnboarding = useOnboardingReplay();
  const emergencyButtonRef = useRef<View>(null);
  const emergencyTitleRef = useRef<Text>(null);
  const wasEmergencyVisibleRef = useRef(false);
  const previousCountdownRef = useRef(emergencyUnlockCountdown);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    const wasVisible = wasEmergencyVisibleRef.current;
    wasEmergencyVisibleRef.current = emergencyUnlockVisible;
    if (!emergencyUnlockVisible && !wasVisible) return;
    const timeout = setTimeout(() => {
      const target = emergencyUnlockVisible ? emergencyTitleRef.current : emergencyButtonRef.current;
      const node = findNodeHandle(target);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 250);
    return () => clearTimeout(timeout);
  }, [emergencyUnlockVisible, reduceMotion]);

  useEffect(() => {
    if (
      emergencyUnlockVisible &&
      previousCountdownRef.current > 0 &&
      emergencyUnlockCountdown === 0
    ) {
      AccessibilityInfo.announceForAccessibility("Emergency unlock is now available.");
    }
    previousCountdownRef.current = emergencyUnlockCountdown;
  }, [emergencyUnlockCountdown, emergencyUnlockVisible]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType={reduceMotion ? "none" : "fade"}
        transparent
        visible={emergencyUnlockVisible}
        onRequestClose={cancelEmergencyUnlock}
      >
        <View style={styles.modalBackdrop}>
          <ScrollView
            accessibilityViewIsModal
            style={styles.emergencyModal}
            contentContainerStyle={styles.emergencyModalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalWarningIcon}>
              <MaterialIcons name="warning-amber" size={30} color="#B83F31" />
            </View>
            <Text ref={emergencyTitleRef} accessibilityRole="header" style={styles.modalTitle}>Emergency unlock</Text>
            <Text style={styles.modalDescription}>
              Only use Emergency Unlock if you need to. This will disable app blocking without your ScanLock QR code.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityHint="Disables app blocking without scanning your QR key"
              accessibilityLabel={
                emergencyUnlockCountdown > 0
                  ? `Emergency unlock available in ${emergencyUnlockCountdown} seconds`
                  : "Confirm emergency unlock"
              }
              accessibilityState={{
                disabled: emergencyUnlockCountdown > 0 || emergencyUnlockChanging,
              }}
              disabled={emergencyUnlockCountdown > 0 || emergencyUnlockChanging}
              onPress={performEmergencyUnlock}
              style={({ pressed }) => [
                styles.modalUnlockButton,
                (emergencyUnlockCountdown > 0 || emergencyUnlockChanging) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.modalUnlockButtonText}>
                {emergencyUnlockChanging
                  ? "Unlocking…"
                  : emergencyUnlockCountdown > 0
                    ? `Wait ${emergencyUnlockCountdown}s`
                    : "Emergency unlock now"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: emergencyUnlockChanging }}
              disabled={emergencyUnlockChanging}
              onPress={cancelEmergencyUnlock}
              style={({ pressed }) => [styles.modalCancelButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <Text accessibilityRole="header" style={styles.title}>Settings</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialIcons name="settings" size={25} color="#7057E8" />
          </View>
        </View>
        <Text style={styles.subtitle}>Choose what ScanLock restricts and manage your fallback access.</Text>

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>FOCUS</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{selectedAppCount} selected</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={styles.primaryIcon}>
              <MaterialIcons name="apps" size={25} color="#7057E8" />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Blocked apps</Text>
              <Text style={styles.cardDescription}>Choose the apps that become unavailable when ScanLock is active.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: locked }}
            disabled={locked}
            onPress={selectBlockedApps}
            style={({ pressed }) => [
              styles.primaryButton,
              locked && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {locked ? "Unlock to change apps" : "Choose apps"}
            </Text>
            <MaterialIcons name="chevron-right" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>SAFETY</Text>
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardTopRow}>
            <View style={styles.dangerIcon}>
              <MaterialIcons name="lock-open" size={25} color="#B83F31" />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Emergency access</Text>
              <Text style={styles.cardDescription}>Immediately disable app blocking if your QR code is unavailable.</Text>
            </View>
          </View>

          <Pressable
            ref={emergencyButtonRef}
            accessibilityRole="button"
            onPress={requestEmergencyUnlock}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
          >
            <MaterialIcons name="warning-amber" size={20} color="#B83F31" />
            <Text style={styles.dangerButtonText}>Emergency unlock</Text>
          </Pressable>
        </View>

        {LEGAL_LINKS_CONFIGURED && (
          <>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>LEGAL &amp; SUPPORT</Text>
            </View>

            <View style={[styles.card, styles.linksCard]}>
              <Pressable
                accessibilityRole="link"
                accessibilityHint="Opens the ScanLock privacy policy in your browser"
                onPress={() => openConfiguredUrl(PRIVACY_POLICY_URL)}
                style={({ pressed }) => [styles.settingsLink, pressed && styles.buttonPressed]}
              >
                <View style={styles.linkIcon}>
                  <MaterialIcons name="privacy-tip" size={22} color="#7057E8" />
                </View>
                <View style={styles.linkCopy}>
                  <Text style={styles.linkTitle}>Privacy Policy</Text>
                  <Text style={styles.linkDescription}>See how ScanLock handles your data.</Text>
                </View>
                <MaterialIcons name="open-in-new" size={20} color="#625D6F" />
              </Pressable>
              <View style={styles.linkDivider} />
              <Pressable
                accessibilityRole="link"
                accessibilityHint="Opens the ScanLock support page in your browser"
                onPress={() => openConfiguredUrl(SUPPORT_URL)}
                style={({ pressed }) => [styles.settingsLink, pressed && styles.buttonPressed]}
              >
                <View style={styles.linkIcon}>
                  <MaterialIcons name="help-outline" size={22} color="#7057E8" />
                </View>
                <View style={styles.linkCopy}>
                  <Text style={styles.linkTitle}>Support</Text>
                  <Text style={styles.linkDescription}>Get help or report a problem.</Text>
                </View>
                <MaterialIcons name="open-in-new" size={20} color="#625D6F" />
              </Pressable>
            </View>
          </>
        )}

        {__DEV__ && (
          <>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>DEBUG · DEVELOPMENT ONLY</Text>
            </View>

            <View style={[styles.card, styles.debugCard]}>
              <View style={styles.cardTopRow}>
                <View style={styles.debugIcon}>
                  <MaterialIcons
                    name={locked ? "lock" : "lock-open"}
                    size={25}
                    color="#4F7C66"
                  />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Lock state</Text>
                  <Text style={styles.cardDescription}>
                    Toggle native app blocking without scanning a QR code.
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: debugLockChanging, checked: locked }}
                disabled={debugLockChanging}
                onPress={toggleDebugLock}
                style={({ pressed }) => [
                  styles.debugButton,
                  debugLockChanging && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <MaterialIcons
                  name={locked ? "lock-open" : "lock"}
                  size={20}
                  color="#4F7C66"
                />
                <Text style={styles.debugButtonText}>
                  {debugLockChanging
                    ? "Updating…"
                    : locked
                      ? "Disable lock without QR"
                      : "Enable lock without QR"}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.card, styles.debugCard, styles.debugStackedCard]}>
              <View style={styles.cardTopRow}>
                <View style={styles.debugIcon}>
                  <MaterialIcons name="bug-report" size={25} color="#4F7C66" />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Onboarding</Text>
                  <Text style={styles.cardDescription}>Reset the first-startup flag and open the walkthrough again.</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={replayOnboarding}
                style={({ pressed }) => [styles.debugButton, pressed && styles.buttonPressed]}
              >
                <MaterialIcons name="replay" size={20} color="#4F7C66" />
                <Text style={styles.debugButtonText}>Replay onboarding</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={styles.securityNote}>
          <MaterialIcons name="verified-user" size={18} color="#888397" />
          <Text style={styles.securityNoteText}>Permission is requested only when an action needs it.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 3 },
  title: { color: "#201C2B", fontSize: 34, fontWeight: "800", letterSpacing: -1 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  subtitle: { color: "#5F596B", fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 340 },
  sectionLabelRow: { minHeight: 46, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10, marginTop: 12 },
  sectionLabel: { color: "#625D6F", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  countPill: { backgroundColor: "#EFECFF", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  countPillText: { color: "#5F46D1", fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#ECE9F2", shadowColor: "#251D4C", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  dangerCard: { borderColor: "#F2DCD7" },
  linksCard: { padding: 0, overflow: "hidden" },
  settingsLink: { minHeight: 72, paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  linkIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  linkCopy: { flex: 1 },
  linkTitle: { color: "#201C2B", fontSize: 16, fontWeight: "700" },
  linkDescription: { color: "#5F596B", fontSize: 13, lineHeight: 18, marginTop: 2 },
  linkDivider: { height: 1, marginLeft: 70, backgroundColor: "#ECE9F2" },
  debugCard: { borderColor: "#D5E5DC" },
  debugStackedCard: { marginTop: 12 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  primaryIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  dangerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#FFF0EC", alignItems: "center", justifyContent: "center" },
  debugIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EAF4EE", alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1 },
  cardTitle: { color: "#201C2B", fontSize: 19, fontWeight: "800" },
  cardDescription: { color: "#5F596B", fontSize: 14, lineHeight: 21, marginTop: 5 },
  primaryButton: { minHeight: 50, borderRadius: 15, marginTop: 20, paddingHorizontal: 17, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  dangerButton: { minHeight: 50, paddingVertical: 12, borderRadius: 15, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF0EC", borderWidth: 1, borderColor: "#E9B8AE" },
  dangerButtonText: { color: "#A93629", fontSize: 15, fontWeight: "700" },
  debugButton: { minHeight: 50, paddingVertical: 12, borderRadius: 15, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EAF4EE", borderWidth: 1, borderColor: "#CDE0D4" },
  debugButtonText: { color: "#456D59", fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.72 },
  buttonDisabled: { opacity: 0.55 },
  securityNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 },
  securityNoteText: { flexShrink: 1, color: "#625D6F", fontSize: 12, textAlign: "center" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(32, 28, 43, 0.58)" },
  emergencyModal: { flexGrow: 0, flexShrink: 1, alignSelf: "center", width: "100%", maxWidth: 390, maxHeight: "90%", borderRadius: 24, backgroundColor: "#FFFFFF", shadowColor: "#201C2B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  emergencyModalContent: { alignItems: "center", padding: 24 },
  modalWarningIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EC" },
  modalTitle: { marginTop: 16, color: "#201C2B", fontSize: 24, fontWeight: "800" },
  modalDescription: { marginTop: 10, color: "#5F596B", fontSize: 15, lineHeight: 22, textAlign: "center" },
  modalUnlockButton: { width: "100%", minHeight: 52, paddingVertical: 13, marginTop: 24, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#B83F31" },
  modalUnlockButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  modalCancelButton: { width: "100%", minHeight: 48, paddingVertical: 12, marginTop: 8, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  modalCancelButtonText: { color: "#514A5D", fontSize: 15, fontWeight: "700" },
});
