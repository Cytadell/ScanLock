import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { QrKeyCard } from "@/components/qr/QrKeyCard";
import { useReduceMotion } from "@/hooks/use-reduce-motion";
import { requestAuthorization, selectApps } from "@/services/appBlocker";
import { getOrCreateQrPayload } from "@/services/qrCode";

type WalkthroughProps = {
  onComplete: () => Promise<void>;
};

const STEPS = ["Welcome", "Choose apps", "Create QR", "How to scan"];

export function FirstRunWalkthrough({ onComplete }: WalkthroughProps) {
  const [step, setStep] = useState(0);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [isChoosingApps, setIsChoosingApps] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSharingQr, setIsSharingQr] = useState(false);
  const qrCardRef = useRef<View>(null);
  const stepHeadingRef = useRef<Text>(null);
  const reduceMotion = useReduceMotion();
  const { width } = useWindowDimensions();
  const compact = width < 700;

  useEffect(() => {
    if (step !== 2 || qrPayload !== null) return;

    getOrCreateQrPayload()
      .then(setQrPayload)
      .catch((error) => {
        console.error("Could not create onboarding QR code:", error);
        Alert.alert("QR code unavailable", "ScanLock could not create your QR code. Please try again.");
      });
  }, [qrPayload, step]);

  useEffect(() => {
    if (step === 0) return;
    const timeout = setTimeout(() => {
      const node = findNodeHandle(stepHeadingRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, reduceMotion ? 0 : 250);
    return () => clearTimeout(timeout);
  }, [reduceMotion, step]);

  async function chooseApps() {
    try {
      setIsChoosingApps(true);
      const authorized = await requestAuthorization();

      if (!authorized) {
        Alert.alert("Permission required", "Screen Time permission is required to choose apps.");
        return;
      }

      await selectApps();
    } catch (error) {
      console.error("Could not open app selector:", error);
      Alert.alert("App selector unavailable", "ScanLock could not open native app selector.");
    } finally {
      setIsChoosingApps(false);
    }
  }

  async function finish() {
    try {
      setIsCompleting(true);
      await onComplete();
    } catch (error) {
      console.error("Could not complete onboarding:", error);
      Alert.alert("Could not finish setup", "Please try again.");
      setIsCompleting(false);
    }
  }

  async function shareQrCode() {
    if (!qrCardRef.current || qrPayload === null) return;

    try {
      setIsSharingQr(true);
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert("Sharing unavailable", "This device cannot share files.");
        return;
      }

      const captureUri = await captureRef(qrCardRef, { format: "png", quality: 1 });
      const capturedImage = new File(captureUri);
      const sharedImage = new File(Paths.cache, "your_scanlock.png");

      if (sharedImage.exists) sharedImage.delete();
      capturedImage.copy(sharedImage);

      await Sharing.shareAsync(sharedImage.uri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
        UTI: "public.png",
      });
    } catch (error) {
      console.error("Could not share onboarding QR code:", error);
      Alert.alert("Error", "Could not share the QR code.");
    } finally {
      setIsSharingQr(false);
    }
  }

  function goForward() {
    if (step === STEPS.length - 1) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.shell, compact && styles.shellCompact]}>
        <View style={[styles.rail, compact && styles.railCompact]}>
          <View style={[styles.brand, compact && styles.brandCompact]}>
            <View accessible={false} style={styles.brandMark}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>ScanLock</Text>
          </View>

          <View style={[styles.progress, compact && styles.progressCompact]}>
            {STEPS.map((label, index) => (
              <View
                key={label}
                accessible
                accessibilityLabel={`${label}, step ${index + 1} of ${STEPS.length}${index === step ? ", current step" : ""}`}
                style={[styles.progressItem, compact && styles.progressItemCompact]}
              >
                <View style={[styles.stepNumber, index === step && styles.stepNumberActive]}>
                  <Text style={[styles.stepNumberText, index === step && styles.stepNumberTextActive]}>{index + 1}</Text>
                </View>
                {!compact && (
                  <View>
                    <Text style={[styles.stepLabel, index === step && styles.stepLabelActive]}>{label}</Text>
                    <Text style={styles.stepHint}>{stepHint(index)}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.main}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Finishes onboarding without selecting apps or reviewing the remaining setup steps"
              disabled={isCompleting}
              accessibilityState={{ disabled: isCompleting, busy: isCompleting }}
              onPress={finish}
              hitSlop={12}
            >
              <Text style={styles.skipText}>Skip setup</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.content}
            alwaysBounceVertical={false}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
          >
            {renderStep(step, qrPayload, isChoosingApps, isSharingQr, chooseApps, shareQrCode, qrCardRef, stepHeadingRef)}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: step === 0 }}
              disabled={step === 0}
              onPress={() => setStep((current) => Math.max(0, current - 1))}
              style={({ pressed }) => [styles.backButton, step === 0 && styles.hidden, pressed && styles.pressed]}
            >
              <MaterialIcons name="arrow-back" size={19} color="#777181" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isCompleting, busy: isCompleting }}
              disabled={isCompleting}
              onPress={goForward}
              style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
            >
              {isCompleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.nextText}>{step === STEPS.length - 1 ? "Finish setup" : "Continue"}</Text>
                  <MaterialIcons name={step === STEPS.length - 1 ? "check" : "arrow-forward"} size={20} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function renderStep(
  step: number,
  qrPayload: string | null,
  isChoosingApps: boolean,
  isSharingQr: boolean,
  chooseApps: () => Promise<void>,
  shareQrCode: () => Promise<void>,
  qrCardRef: React.RefObject<View | null>,
  headingRef: React.RefObject<Text | null>
) {
  if (step === 0) {
    return (
      <View>
        <View style={styles.heroIcon}><MaterialIcons name="shield" size={43} color="#7057E8" /></View>
        <Text style={styles.eyebrow}>WELCOME TO SCANLOCK</Text>
        <Text ref={headingRef} accessibilityRole="header" style={styles.title}>Put some distance between you and distraction.</Text>
        <Text style={styles.body}>ScanLock creates a printable QR code that acts as a physical key for the apps you choose. Scan it to lock them, and scan it again when you are ready to unlock them.</Text>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View>
        <Text style={styles.eyebrow}>CHOOSE APPS</Text>
        <Text ref={headingRef} accessibilityRole="header" style={styles.title}>Which apps should ScanLock restrict?</Text>
        <Text style={styles.body}>Select the apps that distract you the most and get your time back. </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isChoosingApps, busy: isChoosingApps }}
          disabled={isChoosingApps}
          onPress={chooseApps}
          style={({ pressed }) => [styles.pickerCard, pressed && styles.pressed]}
        >
          <View style={styles.pickerIcon}><MaterialIcons name="apps" size={25} color="#7057E8" /></View>
          <View style={styles.pickerCopy}>
            <Text style={styles.pickerTitle}>Select Apps</Text>
          </View>
          {isChoosingApps ? <ActivityIndicator color="#7057E8" /> : <MaterialIcons name="chevron-right" size={25} color="#7057E8" />}
        </Pressable>
        <Note icon="settings" text="You can change this selection later in the Settings tab." />
      </View>
    );
  }

  if (step === 2) {
    return (
      <View>
        <Text style={styles.eyebrow}>CREATE YOUR KEY</Text>
        <Text ref={headingRef} accessibilityRole="header" style={styles.title}>Your ScanLock QR code.</Text>
        <Text style={styles.body}>This code controls the apps you selected. Use the same code to lock and unlock them.</Text>
        <View accessible accessibilityLabel={qrPayload ? "Your ScanLock QR key" : "Generating your ScanLock QR key"} style={styles.qrContainer}>
          {qrPayload ? <QRCode value={qrPayload} size={165} color="#201C2B" backgroundColor="#FFFFFF" /> : <ActivityIndicator accessibilityLabel="Generating your ScanLock QR key" size="large" color="#7057E8" />}
        </View>
        {qrPayload && (
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.exportCardContainer}>
            <QrKeyCard ref={qrCardRef} qrPayload={qrPayload} width={310} qrSize={220} />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Print or Share QR code"
          accessibilityState={{ disabled: qrPayload === null, busy: isSharingQr }}
          disabled={qrPayload === null || isSharingQr}
          onPress={shareQrCode}
          style={({ pressed }) => [styles.shareButton, (qrPayload === null || isSharingQr) && styles.shareButtonDisabled, pressed && styles.pressed]}
        >
          {isSharingQr ? <ActivityIndicator color="#FFFFFF" /> : <MaterialIcons name="ios-share" size={21} color="#FFFFFF" />}
          <Text style={styles.shareButtonText}>Print or Share</Text>
          <MaterialIcons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>
        <Note icon="download" text="You can also print or share this QR code later from the Get Lock tab." />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.eyebrow}>HOW SCANNING WORKS</Text>
      <Text ref={headingRef} accessibilityRole="header" style={styles.title}>Your QR code becomes the key.</Text>
      <Text style={styles.body}>Keep it somewhere intentional—across the room, by the door, or anywhere that creates distance between you and distraction.</Text>
      <View style={styles.mechanismRow}>
        <Mechanism icon="qr-code-scanner" title="Scan" text="Open ScanLock and point the camera at your code." />
        <Mechanism icon="lock" title="Lock" text="Your selected apps become unavailable." />
        <Mechanism icon="lock-open" title="Scan again" text="Return to the code when you want access back." />
      </View>
    </View>
  );
}

function Note({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return <View style={styles.note}><MaterialIcons name={icon} size={19} color="#625A70" /><Text style={styles.noteText}>{text}</Text></View>;
}

function Mechanism({ icon, title, text }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string }) {
  return <View style={styles.mechanism}><MaterialIcons name={icon} size={25} color="#7057E8" /><Text style={styles.mechanismTitle}>{title}</Text><Text style={styles.mechanismText}>{text}</Text></View>;
}

function stepHint(step: number) {
  return ["How ScanLock works", "Use App selector", "Make your key", "Lock and unlock"][step];
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  shell: { flex: 1, flexDirection: "row" },
  shellCompact: { flexDirection: "column" },
  rail: { width: 220, paddingHorizontal: 22, paddingTop: 24, backgroundColor: "#FFFFFF", borderRightWidth: 1, borderRightColor: "#ECE9F2" },
  railCompact: { width: "100%", paddingTop: 12, paddingBottom: 14, borderRightWidth: 0, borderBottomWidth: 1, borderBottomColor: "#ECE9F2" },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 40 },
  brandCompact: { marginBottom: 14 },
  brandMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#7057E8", alignItems: "center", justifyContent: "center" },
  brandText: { color: "#201C2B", fontSize: 17, fontWeight: "800" },
  progress: { gap: 25 },
  progressCompact: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  progressItem: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  progressItemCompact: { flex: 1 },
  stepNumber: { width: 27, height: 27, borderRadius: 14, borderWidth: 1, borderColor: "#DCD8E6", alignItems: "center", justifyContent: "center" },
  stepNumberActive: { backgroundColor: "#7057E8", borderColor: "#7057E8" },
  stepNumberText: { color: "#888397", fontSize: 12, fontWeight: "700" },
  stepNumberTextActive: { color: "#FFFFFF" },
  stepLabel: { color: "#888397", fontSize: 13, fontWeight: "700" },
  stepLabelActive: { color: "#201C2B" },
  stepHint: { color: "#6E687A", fontSize: 11, marginTop: 2 },
  main: { flex: 1, paddingHorizontal: 24, paddingBottom: 22 },
  topBar: { minHeight: 52, alignItems: "flex-end", justifyContent: "center" },
  skipText: { color: "#5F596B", fontSize: 14, fontWeight: "600" },
  contentScroll: { flex: 1, width: "100%", maxWidth: 620, alignSelf: "center" },
  content: { flexGrow: 1, justifyContent: "center", paddingVertical: 20 },
  heroIcon: { width: 88, height: 88, borderRadius: 27, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center", marginBottom: 25 },
  eyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  title: { color: "#201C2B", fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1, maxWidth: 560 },
  body: { color: "#5F596B", fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 540 },
  pickerCard: { minHeight: 76, marginTop: 28, borderRadius: 20, borderWidth: 1, borderColor: "#E4E0ED", backgroundColor: "#FFFFFF", padding: 15, flexDirection: "row", alignItems: "center", gap: 13 },
  pickerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  pickerCopy: { flex: 1 },
  pickerTitle: { color: "#201C2B", fontSize: 16, fontWeight: "800" },
  pickerHint: { color: "#5F596B", fontSize: 12, marginTop: 3 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 17 },
  noteText: { flex: 1, color: "#4F485A", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  qrContainer: { width: 195, height: 195, alignSelf: "center", marginTop: 16, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9E6F0", alignItems: "center", justifyContent: "center" },
  exportCardContainer: { position: "absolute", left: -1000, top: 0 },
  shareButton: { width: "100%", maxWidth: 330, minHeight: 48, alignSelf: "center", marginTop: 12, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#7057E8", flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#7057E8", shadowOpacity: 0.24, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  shareButtonDisabled: { opacity: 0.55 },
  shareButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  mechanismRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 30 },
  mechanism: { flexGrow: 1, flexBasis: 155, borderTopWidth: 1, borderTopColor: "#DCD8E6", paddingTop: 16 },
  mechanismTitle: { color: "#201C2B", fontSize: 15, fontWeight: "800", marginTop: 10 },
  mechanismText: { color: "#5F596B", fontSize: 12, lineHeight: 18, marginTop: 5 },
  actions: { minHeight: 62, width: "100%", maxWidth: 620, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 20 },
  backButton: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 7 },
  backText: { color: "#777181", fontSize: 15, fontWeight: "700" },
  nextButton: { minWidth: 136, minHeight: 52, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#7057E8", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  nextText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  hidden: { opacity: 0 },
  pressed: { opacity: 0.72 },
});
