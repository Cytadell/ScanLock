import { useSettings } from "@/hooks/use-settings";
import { useOnboardingReplay } from "@/hooks/use-onboarding-replay";
import {
  generateUniversalQrPayload,
  isUniversalQrEnabled,
} from "@/services/qrCode";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Sharing from "expo-sharing";
import { useRef } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { captureRef } from "react-native-view-shot";

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
  const universalQrRef = useRef<View>(null);
  const universalQrPayload = isUniversalQrEnabled
    ? generateUniversalQrPayload()
    : "";

  async function shareUniversalQrCode() {
    if (!universalQrRef.current) return;

    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

      const uri = await captureRef(universalQrRef, {
        format: "png",
        quality: 1,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Universal QR Code",
      });
    } catch (error) {
      console.error("Could not share universal QR code:", error);
      Alert.alert("Error", "Could not share the universal QR code.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="fade"
        transparent
        visible={emergencyUnlockVisible}
        onRequestClose={cancelEmergencyUnlock}
      >
        <View style={styles.modalBackdrop}>
          <View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={styles.emergencyModal}
          >
            <View style={styles.modalWarningIcon}>
              <MaterialIcons name="warning-amber" size={30} color="#D85C4A" />
            </View>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalDescription}>
              Only use Emergency Unlock if you need to. This will disable app blocking without your QR code.
            </Text>

            <Pressable
              accessibilityRole="button"
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
              disabled={emergencyUnlockChanging}
              onPress={cancelEmergencyUnlock}
              style={({ pressed }) => [styles.modalCancelButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PREFERENCES</Text>
            <Text style={styles.title}>Settings</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialIcons name="settings" size={25} color="#7057E8" />
          </View>
        </View>
        <Text style={styles.subtitle}>Choose what ScanLock protects and manage your fallback access.</Text>

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
              <MaterialIcons name="lock-open" size={25} color="#D85C4A" />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>Emergency access</Text>
              <Text style={styles.cardDescription}>Immediately disable app blocking if your QR code is unavailable.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={requestEmergencyUnlock}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
          >
            <MaterialIcons name="warning-amber" size={20} color="#D85C4A" />
            <Text style={styles.dangerButtonText}>Emergency unlock</Text>
          </Pressable>
        </View>

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

        {isUniversalQrEnabled && (
          <>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>TESTING · NON-PRODUCTION</Text>
            </View>

            <View style={[styles.card, styles.debugCard, styles.universalQrCard]}>
              <View style={styles.cardTopRow}>
                <View style={styles.debugIcon}>
                  <MaterialIcons name="qr-code-2" size={25} color="#4F7C66" />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Universal QR code</Text>
                  <Text style={styles.cardDescription}>This development key is accepted by every ScanLock installation.</Text>
                </View>
              </View>

              <View ref={universalQrRef} collapsable={false} style={styles.universalQrImage}>
                <Text style={styles.universalQrBrand}>ScanLock Universal Key</Text>
                <QRCode value={universalQrPayload} size={180} color="#201C2B" backgroundColor="#FFFFFF" />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share or save universal QR code"
                onPress={shareUniversalQrCode}
                style={({ pressed }) => [styles.debugButton, pressed && styles.buttonPressed]}
              >
                <MaterialIcons name="ios-share" size={20} color="#4F7C66" />
                <Text style={styles.debugButtonText}>Share or save universal QR</Text>
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
  subtitle: { color: "#6E687A", fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 340 },
  sectionLabelRow: { minHeight: 46, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10, marginTop: 12 },
  sectionLabel: { color: "#888397", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  countPill: { backgroundColor: "#EFECFF", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  countPillText: { color: "#7057E8", fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#ECE9F2", shadowColor: "#251D4C", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  dangerCard: { borderColor: "#F2DCD7" },
  debugCard: { borderColor: "#D5E5DC" },
  debugStackedCard: { marginTop: 12 },
  universalQrCard: { marginTop: 12 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  primaryIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  dangerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#FFF0EC", alignItems: "center", justifyContent: "center" },
  debugIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EAF4EE", alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1 },
  cardTitle: { color: "#201C2B", fontSize: 19, fontWeight: "800" },
  cardDescription: { color: "#6E687A", fontSize: 14, lineHeight: 21, marginTop: 5 },
  primaryButton: { height: 50, borderRadius: 15, marginTop: 20, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  dangerButton: { height: 50, borderRadius: 15, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF0EC", borderWidth: 1, borderColor: "#F2CFC7" },
  dangerButtonText: { color: "#D85C4A", fontSize: 15, fontWeight: "700" },
  debugButton: { height: 50, borderRadius: 15, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#EAF4EE", borderWidth: 1, borderColor: "#CDE0D4" },
  debugButtonText: { color: "#4F7C66", fontSize: 15, fontWeight: "700" },
  universalQrImage: { alignItems: "center", gap: 14, marginTop: 20, padding: 20, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D5E5DC" },
  universalQrBrand: { color: "#201C2B", fontSize: 16, fontWeight: "800" },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  buttonDisabled: { opacity: 0.55 },
  securityNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 },
  securityNoteText: { color: "#888397", fontSize: 12 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(32, 28, 43, 0.58)" },
  emergencyModal: { width: "100%", maxWidth: 390, alignItems: "center", padding: 24, borderRadius: 24, backgroundColor: "#FFFFFF", shadowColor: "#201C2B", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  modalWarningIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EC" },
  modalTitle: { marginTop: 16, color: "#201C2B", fontSize: 24, fontWeight: "800" },
  modalDescription: { marginTop: 10, color: "#6E687A", fontSize: 15, lineHeight: 22, textAlign: "center" },
  modalUnlockButton: { width: "100%", height: 52, marginTop: 24, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#D85C4A" },
  modalUnlockButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  modalCancelButton: { width: "100%", height: 48, marginTop: 8, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  modalCancelButtonText: { color: "#6E687A", fontSize: 15, fontWeight: "700" },
});
