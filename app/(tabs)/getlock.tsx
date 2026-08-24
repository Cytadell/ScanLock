import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { QrKeyCard } from "@/components/qr/QrKeyCard";
import { useGetLock } from "@/hooks/use-get-lock";

type ExportFormat = "foldable" | "png";

const FORMAT_COPY = {
  foldable: {
    title: "Foldable card",
    description: "Prints on one letter-size page, then folds into a small standing card.",
    icon: "picture-as-pdf" as const,
  },
  png: {
    title: "QR image",
    description: "A standalone PNG you can resize, place in a document, or print yourself.",
    icon: "image" as const,
  },
};

export default function GetLockScreen() {
  const {
    qrPayload,
    qrCardRef,
    foldablePreviewHtml,
    isPreparingPreview,
    previewError,
    isSharing,
    prepareFoldablePreview,
    shareQrCode,
  } = useGetLock();
  const [previewFormat, setPreviewFormat] = useState<ExportFormat | null>(null);
  const { height, width } = useWindowDimensions();
  const previewHeight = Math.min(430, Math.max(300, height - 330));
  const paperWidth = Math.min(width - 64, (previewHeight - 24) * (8.5 / 11));
  const paperHeight = paperWidth * (11 / 8.5);
  const qrCardWidth = Math.max(200, Math.min(280, width - 80, previewHeight * 0.64));
  const qrSize = Math.min(190, qrCardWidth - 72);

  useEffect(() => {
    if (previewFormat === null) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setPreviewFormat(null);
      return true;
    });

    return () => subscription.remove();
  }, [previewFormat]);

  if (qrPayload === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator accessibilityLabel="Generating your ScanLock QR key" size="large" color="#7057E8" />
      </View>
    );
  }

  const openPreview = (format: ExportFormat) => {
    setPreviewFormat(format);
    if (format === "foldable") void prepareFoldablePreview();
  };

  const exportCard = (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.exportCardContainer}
    >
      <QrKeyCard ref={qrCardRef} qrPayload={qrPayload} width={310} qrSize={220} showBrand />
    </View>
  );

  if (previewFormat !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.previewContainer}>
          <Header showClose onClose={() => setPreviewFormat(null)} />
          <FormatPreview
            format={previewFormat}
            foldablePreviewHtml={foldablePreviewHtml}
            isPreparingPreview={isPreparingPreview}
            previewError={previewError}
            isSharing={isSharing}
            paperWidth={paperWidth}
            paperHeight={paperHeight}
            previewHeight={previewHeight}
            qrPayload={qrPayload}
            qrCardWidth={qrCardWidth}
            qrSize={qrSize}
            onRetry={prepareFoldablePreview}
            onShare={() => shareQrCode(previewFormat)}
          />
          {exportCard}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        alwaysBounceVertical={false}
        bounces={false}
        contentContainerStyle={styles.container}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <Header showClose={false} onClose={() => undefined} />
        <FormatChooser onSelect={openPreview} />
        {exportCard}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ showClose, onClose }: { showClose: boolean; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.iconBadge}>
        <MaterialIcons name="qr-code-2" size={24} color="#7057E8" />
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>YOUR KEY</Text>
        <Text
          accessibilityRole="header"
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          numberOfLines={1}
          style={styles.title}
        >
          Print your ScanLock
        </Text>
      </View>
      {showClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close preview"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <MaterialIcons name="close" size={24} color="#51486F" />
        </Pressable>
      )}
    </View>
  );
}

function FormatChooser({ onSelect }: { onSelect: (format: ExportFormat) => void }) {
  return (
    <View style={styles.chooser}>
      <Text style={styles.sectionDescription}>
        You need to <Text style={styles.requirementEmphasis}>print a physical ScanLock</Text> to lock and unlock apps. Choose a format below to get started.
      </Text>

      <View style={styles.formatSection}>
        <Text style={styles.formatLabel}>CHOOSE A FORMAT</Text>
        <View style={styles.choiceList}>
          <FormatChoice format="foldable" recommended onPress={() => onSelect("foldable")} />
          <FormatChoice format="png" onPress={() => onSelect("png")} />
        </View>
      </View>

      <View style={styles.tipRow}>
        <View style={styles.tipIcon}>
          <MaterialIcons name="lightbulb-outline" size={18} color="#7057E8" />
        </View>
        <Text style={styles.tipText}>Place your printed ScanLock away from you to add intentional distance.</Text>
      </View>
    </View>
  );
}

function FormatChoice({
  format,
  recommended = false,
  onPress,
}: {
  format: ExportFormat;
  recommended?: boolean;
  onPress: () => void;
}) {
  const copy = FORMAT_COPY[format];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}${recommended ? ", recommended" : ""}`}
      accessibilityHint={copy.description}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceCard, pressed && styles.choiceCardPressed]}
    >
      <View style={styles.choiceIcon}>
        <MaterialIcons name={copy.icon} size={28} color="#7057E8" />
      </View>
      <View style={styles.choiceCopy}>
        <View style={styles.choiceTitleRow}>
          <Text style={styles.choiceTitle}>{copy.title}</Text>
          {recommended && <Text style={styles.recommendedBadge}>RECOMMENDED</Text>}
        </View>
        <Text style={styles.choiceDescription}>{copy.description}</Text>
      </View>
      <MaterialIcons name="arrow-forward" size={22} color="#7057E8" />
    </Pressable>
  );
}

type FormatPreviewProps = {
  format: ExportFormat;
  foldablePreviewHtml: string | null;
  isPreparingPreview: boolean;
  previewError: string | null;
  isSharing: boolean;
  paperWidth: number;
  paperHeight: number;
  previewHeight: number;
  qrPayload: string;
  qrCardWidth: number;
  qrSize: number;
  onRetry: () => void;
  onShare: () => void;
};

function FormatPreview({
  format,
  foldablePreviewHtml,
  isPreparingPreview,
  previewError,
  isSharing,
  paperWidth,
  paperHeight,
  previewHeight,
  qrPayload,
  qrCardWidth,
  qrSize,
  onRetry,
  onShare,
}: FormatPreviewProps) {
  const copy = FORMAT_COPY[format];
  const shareDisabled = isSharing || (format === "foldable" && !foldablePreviewHtml);
  const previewHtml = foldablePreviewHtml?.replace(
    "width=816, initial-scale=1.0",
    `width=816, initial-scale=${(paperWidth / 816).toFixed(4)}, maximum-scale=${(paperWidth / 816).toFixed(4)}, user-scalable=no`
  );

  return (
    <View style={styles.previewSection}>
      <View>
        <Text accessibilityRole="header" style={styles.previewTitle}>{copy.title}</Text>
        <Text style={styles.previewDescription}>{copy.description}</Text>
      </View>

      <View style={[styles.previewStage, { height: previewHeight }]}>
        {format === "png" ? (
          <QrKeyCard qrPayload={qrPayload} width={qrCardWidth} qrSize={qrSize} showBrand />
        ) : previewError ? (
          <PreviewError message={previewError} onRetry={onRetry} />
        ) : isPreparingPreview || previewHtml === null || previewHtml === undefined ? (
          <View style={styles.previewStatus}>
            <ActivityIndicator accessibilityLabel="Preparing foldable card preview" size="large" color="#7057E8" />
            <Text style={styles.previewStatusText}>Preparing your foldable card…</Text>
          </View>
        ) : (
          <View style={[styles.paperPreview, { width: paperWidth, height: paperHeight }]}>
            <WebView
              accessible
              accessibilityLabel="Preview of the foldable card printout"
              automaticallyAdjustContentInsets={false}
              bounces={false}
              originWhitelist={["*"]}
              overScrollMode="never"
              scalesPageToFit
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              source={{ html: previewHtml }}
              style={styles.webView}
            />
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Print or Share ${format === "foldable" ? "Foldable Card" : "PNG Image"}`}
        accessibilityState={{ busy: isSharing, disabled: shareDisabled }}
        disabled={shareDisabled}
        onPress={onShare}
        style={({ pressed }) => [styles.shareButton, shareDisabled && styles.shareButtonDisabled, pressed && styles.shareButtonPressed]}
      >
        {isSharing
          ? <ActivityIndicator color="#FFFFFF" />
          : <MaterialIcons name="ios-share" size={22} color="#FFFFFF" />}
        <Text style={styles.shareButtonText}>Print or Share</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function PreviewError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityRole="alert" style={styles.previewStatus}>
      <View style={styles.errorIcon}>
        <MaterialIcons name="error-outline" size={28} color="#B54747" />
      </View>
      <Text style={styles.errorTitle}>Preview unavailable</Text>
      <Text style={styles.previewStatusText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry foldable card preview"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <MaterialIcons name="refresh" size={18} color="#7057E8" />
        <Text style={styles.retryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  previewContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 3 },
  title: { color: "#201C2B", fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
  closeButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3DFEA" },
  pressed: { opacity: 0.72 },
  chooser: { flex: 1, paddingTop: 28 },
  requirementEmphasis: { color: "#7057E8", fontWeight: "900" },
  sectionDescription: { color: "#3F3948", fontSize: 15, fontWeight: "600", lineHeight: 23 },
  formatSection: { marginTop: 24 },
  formatLabel: { color: "#7057E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 8 },
  choiceList: { gap: 10 },
  choiceCard: { minHeight: 112, flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1.5, borderColor: "#E3DFEA", borderRadius: 18, backgroundColor: "#FFFFFF" },
  choiceCardPressed: { borderColor: "#7057E8", backgroundColor: "#F5F2FF", transform: [{ scale: 0.99 }] },
  choiceIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#EFECFF" },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 },
  choiceTitle: { color: "#201C2B", fontSize: 17, fontWeight: "800" },
  recommendedBadge: { color: "#7057E8", fontSize: 8, fontWeight: "900", letterSpacing: 0.7, backgroundColor: "#EFECFF", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  choiceDescription: { color: "#5F596B", fontSize: 12, lineHeight: 18, marginTop: 7 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: "auto", padding: 13, borderRadius: 14, backgroundColor: "#EFECFF" },
  tipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, color: "#51486F", fontSize: 12, lineHeight: 18 },
  previewSection: { flex: 1, gap: 10, paddingTop: 16 },
  previewTitle: { color: "#201C2B", fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  previewDescription: { color: "#5F596B", fontSize: 13, lineHeight: 19, marginTop: 5 },
  previewStage: { alignItems: "center", justifyContent: "center", borderRadius: 20, overflow: "hidden", backgroundColor: "#EFEDF4", borderWidth: 1, borderColor: "#E3DFEA", padding: 12 },
  paperPreview: { overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7D2DE", shadowColor: "#251D4C", shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  webView: { flex: 1, backgroundColor: "#FFFFFF" },
  previewStatus: { alignItems: "center", justifyContent: "center", maxWidth: 280, gap: 10 },
  previewStatusText: { color: "#5F596B", fontSize: 13, lineHeight: 19, textAlign: "center" },
  errorIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FCEBEC" },
  errorTitle: { color: "#201C2B", fontSize: 17, fontWeight: "800" },
  retryButton: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4, paddingHorizontal: 16, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8D2E6" },
  retryButtonText: { color: "#7057E8", fontSize: 13, fontWeight: "800" },
  exportCardContainer: { position: "absolute", left: -1000, top: 0 },
  shareButton: { minHeight: 56, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8", shadowColor: "#7057E8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  shareButtonPressed: { opacity: 0.82 },
  shareButtonDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
