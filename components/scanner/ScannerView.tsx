import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScanStatus } from "@/hooks/use-lock-scanner";
import { BarcodeScanningResult, CameraView } from "expo-camera";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useReduceMotion } from "@/hooks/use-reduce-motion";

type Props = {
  status: ScanStatus;
  locked: boolean;
  torchEnabled: boolean;
  errorMessage?: string;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onToggleTorch: () => void;
  onRetry: () => void;
  onClose: () => void;
};

export function ScannerView({
  status,
  locked,
  torchEnabled,
  errorMessage,
  onBarcodeScanned,
  onToggleTorch,
  onRetry,
  onClose,
}: Props) {
  const scanLine = useRef(new Animated.Value(0)).current;
  const frameScale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const canUseCamera = !["requesting-permission", "permission-denied"].includes(status);
  const frameSize = Math.max(210, Math.min(286, width - 64, height * 0.36));

  useEffect(() => {
    if (status !== "scanning" || reduceMotion) {
      scanLine.stopAnimation();
      scanLine.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanLine, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, scanLine, status]);

  useEffect(() => {
    if (status === "success" && !reduceMotion) {
      Animated.sequence([
        Animated.spring(frameScale, { toValue: 1.05, useNativeDriver: true }),
        Animated.spring(frameScale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [frameScale, reduceMotion, status]);

  const successColor = locked ? "#B83F31" : "#08785A";
  const frameColor = status === "success" ? successColor : ["error", "invalid-code"].includes(status) ? "#FF6B6B" : "#FFFFFF";
  const message = getStatusMessage(status, locked, errorMessage);

  useEffect(() => {
    const announcement = getStatusAnnouncement(status, locked, errorMessage);
    if (announcement) AccessibilityInfo.announceForAccessibility(announcement);
  }, [errorMessage, locked, status]);

  return (
    <View style={styles.container}>
      {canUseCamera ? (
        <CameraView
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchEnabled}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={status === "scanning" ? onBarcodeScanned : undefined}
        />
      ) : (
        <View style={styles.permissionBackground} />
      )}
      <View style={styles.scrim} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close scanner" onPress={onClose} style={styles.circleButton}>
            <MaterialIcons name="close" size={25} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>SCANLOCK</Text>
            <Text accessibilityRole="header" style={styles.headerTitle}>Scan your QR code</Text>
          </View>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.centerContent}>
          {status === "permission-denied" ? (
            <View style={styles.permissionCard}>
              <View style={styles.permissionIcon}>
                <MaterialIcons name="no-photography" size={34} color="#7057E8" />
              </View>
              <Text style={styles.permissionTitle}>Camera access is off</Text>
              <Text style={styles.permissionText}>Allow camera access in Settings so ScanLock can read QR codes.</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityHint="Opens the iOS Settings app"
                style={styles.settingsButton}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </Pressable>
            </View>
          ) : (
            <Animated.View
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.scanFrame,
                {
                  width: frameSize,
                  height: frameSize,
                  borderColor: frameColor,
                  transform: [{ scale: frameScale }],
                },
              ]}
            >
              <View style={[styles.corner, styles.topLeft, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: frameColor }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: frameColor }]} />

              {status === "scanning" && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLine.interpolate({ inputRange: [0, 1], outputRange: [12, frameSize - 34] }) }] },
                  ]}
                />
              )}
              {(status === "verifying" || status === "requesting-permission") && (
                <ActivityIndicator size="large" color="#FFFFFF" />
              )}
              {status === "success" && (
                <View style={[styles.resultIcon, { backgroundColor: successColor }]}>
                  <MaterialIcons name="check" size={52} color="#FFFFFF" />
                </View>
              )}
              {(status === "error" || status === "invalid-code") && (
                <View style={[styles.resultIcon, styles.errorIcon]}>
                  <MaterialIcons name="priority-high" size={48} color="#FFFFFF" />
                </View>
              )}
            </Animated.View>
          )}

          {status !== "permission-denied" && (
            <View style={styles.messageBlock}>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.messageTitle}>{message.title}</Text>
              <Text style={styles.messageText}>{message.detail}</Text>
              {(status === "error" || status === "invalid-code") && (
                <Pressable accessibilityRole="button" style={styles.retryButton} onPress={onRetry}>
                  <MaterialIcons name="refresh" size={19} color="#18151F" />
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomBar}>
          {canUseCamera && status === "scanning" ? (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Flashlight"
              accessibilityState={{ checked: torchEnabled }}
              onPress={onToggleTorch}
              style={styles.torchControl}
            >
              <View style={[styles.circleButton, torchEnabled && styles.circleButtonActive]}>
                <MaterialIcons name={torchEnabled ? "flashlight-on" : "flashlight-off"} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.torchText}>Flashlight {torchEnabled ? "on" : "off"}</Text>
            </Pressable>
          ) : (
            <View style={styles.bottomPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function getStatusAnnouncement(status: ScanStatus, isLocked: boolean, errorMessage?: string) {
  switch (status) {
    case "requesting-permission":
      return "Getting the camera ready. You may be asked to allow camera access.";
    case "scanning":
      return "Camera ready. Position your ScanLock QR code in the frame.";
    case "verifying":
      return "QR code detected. Verifying.";
    case "success":
      return isLocked ? "Apps locked." : "Apps unlocked.";
    case "invalid-code":
      return "That is not your ScanLock QR code. Try again.";
    case "permission-denied":
      return "Camera access is off. Open Settings to allow camera access.";
    case "error":
      return errorMessage ?? "Could not update your apps. Try again.";
  }
}

function getStatusMessage(status: ScanStatus, isLocked: boolean, errorMessage?: string) {
  switch (status) {
    case "requesting-permission":
      return { title: "Getting camera ready…", detail: "You may be asked to allow camera access." };
    case "verifying":
      return { title: "Applying your change…", detail: "Keep ScanLock open for just a moment." };
    case "success":
      return { title: isLocked ? "Apps locked" : "Apps unlocked", detail: isLocked ? "Your focus session starts now." : "Your selected apps are available again." };
    case "invalid-code":
      return { title: "That isn’t your ScanLock", detail: "Scan the QR code generated in the Get Lock tab." };
    case "error":
      return { title: "Couldn’t update your apps", detail: errorMessage ?? "Something went wrong. Please try again." };
    default:
      return { title: "Position the code in the frame", detail: "ScanLock will recognize it automatically." };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0910" },
  permissionBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#18151F" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 6, 12, 0.48)" },
  safeArea: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12 },
  circleButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18, 15, 23, 0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  circleButtonActive: { backgroundColor: "#7057E8", borderColor: "#8D79EF" },
  titleBlock: { alignItems: "center" },
  eyebrow: { color: "rgba(255,255,255,0.65)", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginTop: 2 },
  topSpacer: { width: 48 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  scanFrame: { borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(0,0,0,0.08)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  corner: { position: "absolute", width: 50, height: 50, borderWidth: 4 },
  topLeft: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 30 },
  topRight: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 30 },
  bottomLeft: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 30 },
  bottomRight: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 30 },
  scanLine: { position: "absolute", top: 0, left: 16, right: 16, height: 2, borderRadius: 2, backgroundColor: "#A996FF", shadowColor: "#A996FF", shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  resultIcon: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center", backgroundColor: "#16A079" },
  errorIcon: { backgroundColor: "#FF6B6B" },
  messageBlock: { minHeight: 116, alignItems: "center", marginTop: 28 },
  messageTitle: { color: "#FFFFFF", fontSize: 21, fontWeight: "700", textAlign: "center" },
  messageText: { color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 7, maxWidth: 300 },
  retryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFFFFF", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 99, marginTop: 16 },
  retryText: { color: "#18151F", fontSize: 14, fontWeight: "700" },
  bottomBar: { height: 108, alignItems: "center", justifyContent: "flex-start" },
  torchControl: { alignItems: "center", gap: 8 },
  torchText: { color: "rgba(255,255,255,0.88)", fontSize: 12 },
  bottomPlaceholder: { height: 70 },
  permissionCard: { width: "100%", maxWidth: 350, padding: 28, borderRadius: 28, backgroundColor: "#FFFFFF", alignItems: "center" },
  permissionIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  permissionTitle: { color: "#201C2B", fontSize: 23, fontWeight: "800", textAlign: "center" },
  permissionText: { color: "#6E687A", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 9 },
  settingsButton: { minHeight: 48, justifyContent: "center", backgroundColor: "#7057E8", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginTop: 22 },
  settingsButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
