import { useGetLock } from "@/hooks/use-get-lock";
import { QrKeyCard } from "@/components/qr/QrKeyCard";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GetLockScreen() {
  const { qrPayload, qrCardRef, isSharing, shareQrCode } = useGetLock();
  const [selectedFormat, setSelectedFormat] = useState<"foldable" | "png">("foldable");
  const { width } = useWindowDimensions();
  const qrCardWidth = Math.min(270, Math.max(230, width - 80));
  const qrSize = Math.min(180, qrCardWidth - 72);

  if (qrPayload === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator accessibilityLabel="Generating your ScanLock QR key" size="large" color="#7057E8" />
      </View>
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
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <MaterialIcons name="qr-code-2" size={24} color="#7057E8" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR KEY</Text>
            <Text accessibilityRole="header" style={styles.title}>Take focus offline</Text>
          </View>
        </View>

        <View style={styles.qrShell}>
          <QrKeyCard
            qrPayload={qrPayload}
            width={qrCardWidth}
            qrSize={qrSize}
          />
        </View>

        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.exportCardContainer}
        >
          <QrKeyCard
            ref={qrCardRef}
            qrPayload={qrPayload}
            width={310}
            qrSize={220}
            showBrand
          />
        </View>

        <View style={styles.tipRow}>
          <View style={styles.tipIcon}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#7057E8" />
          </View>
          <Text style={styles.tipText}>
            Print your ScanLock and try placing it away from you.
          </Text>
        </View>

        <View style={styles.formatSection}>
          <Text style={styles.formatLabel}>CHOOSE A FORMAT</Text>
          <View accessibilityRole="radiogroup" style={styles.formatOptions}>
            <FormatOption
              icon="picture-as-pdf"
              label="Foldable Card (recommended)"
              selected={selectedFormat === "foldable"}
              onPress={() => setSelectedFormat("foldable")}
            />
            <FormatOption
              icon="image"
              label="Image"
              selected={selectedFormat === "png"}
              onPress={() => setSelectedFormat("png")}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Print or Share ${selectedFormat === "foldable" ? "Foldable Card" : "PNG Image"}`}
          accessibilityState={{ busy: isSharing, disabled: isSharing }}
          disabled={isSharing}
          onPress={() => shareQrCode(selectedFormat)}
          style={({ pressed }) => [styles.shareButton, isSharing && styles.shareButtonDisabled, pressed && styles.shareButtonPressed]}
        >
          {isSharing
            ? <ActivityIndicator color="#FFFFFF" />
            : <MaterialIcons name="ios-share" size={22} color="#FFFFFF" />}
          <Text style={styles.shareButtonText}>Print or Share</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

type FormatOptionProps = {
  icon: "image" | "picture-as-pdf";
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FormatOption({ icon, label, selected, onPress }: FormatOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.formatOption, selected && styles.formatOptionSelected, pressed && styles.formatOptionPressed]}
    >
      <View style={[styles.formatIcon, selected && styles.formatIconSelected]}>
        <MaterialIcons name={icon} size={19} color={selected ? "#FFFFFF" : "#7057E8"} />
      </View>
      <View style={styles.formatCopy}>
        <Text numberOfLines={1} style={styles.formatName}>{label}</Text>
      </View>
      <MaterialIcons name={selected ? "radio-button-checked" : "radio-button-unchecked"} size={19} color={selected ? "#7057E8" : "#AAA4B6"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 3 },
  title: { color: "#201C2B", fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  qrShell: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  exportCardContainer: { position: "absolute", left: -1000, top: 0 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11, borderRadius: 14, backgroundColor: "#EFECFF", marginBottom: 12 },
  tipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, color: "#51486F", fontSize: 12, lineHeight: 18 },
  formatSection: { marginBottom: 8 },
  formatLabel: { marginBottom: 7, color: "#7057E8", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  formatOptions: { gap: 7 },
  formatOption: { width: "100%", minHeight: 46, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 11, paddingVertical: 6, borderWidth: 1.5, borderColor: "#E3DFEA", borderRadius: 13, backgroundColor: "#FFFFFF" },
  formatOptionSelected: { borderColor: "#7057E8", backgroundColor: "#F5F2FF" },
  formatOptionPressed: { opacity: 0.78 },
  formatIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#EFECFF" },
  formatIconSelected: { backgroundColor: "#7057E8" },
  formatCopy: { flex: 1, minWidth: 0 },
  formatName: { color: "#201C2B", fontSize: 12, fontWeight: "700" },
  shareButton: { minHeight: 56, marginTop: 6, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8", shadowColor: "#7057E8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  shareButtonPressed: { opacity: 0.82 },
  shareButtonDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
