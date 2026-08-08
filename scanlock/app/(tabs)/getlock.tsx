import { useGetLock } from "@/hooks/use-get-lock";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function GetLockScreen() {
  const { qrPayload, qrCardRef, shareQrCode, requestQrKeyReplacement } = useGetLock();

  if (qrPayload === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7057E8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <MaterialIcons name="qr-code-2" size={24} color="#7057E8" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR KEY</Text>
            <Text style={styles.title}>Take focus offline</Text>
          </View>
        </View>

        <View style={styles.qrShell}>
          <View ref={qrCardRef} collapsable={false} style={styles.qrCard}>
            <View style={styles.cardBrandRow}>
              <View style={styles.cardBrandMark}>
                <MaterialIcons name="lock" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.cardBrand}>ScanLock</Text>
            </View>

            <View style={styles.qrCodeFrame}>
              <QRCode value={qrPayload} size={220} color="#201C2B" backgroundColor="#FFFFFF" />
            </View>

            <Text style={styles.cardTitle}>Your ScanLock key</Text>
            <Text style={styles.cardInstruction}>Keep this code away from your phone</Text>
          </View>
        </View>

        <View style={styles.tipRow}>
          <View style={styles.tipIcon}>
            <MaterialIcons name="lightbulb-outline" size={18} color="#7057E8" />
          </View>
          <Text style={styles.tipText}>
            Print your ScanLock and try placing it away from you.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Print or share QR code"
          onPress={shareQrCode}
          style={({ pressed }) => [styles.shareButton, pressed && styles.shareButtonPressed]}
        >
          <MaterialIcons name="ios-share" size={22} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Print or share</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Replace QR key"
          accessibilityHint="Invalidates the current QR code and creates a new one"
          onPress={requestQrKeyReplacement}
          style={({ pressed }) => [styles.replaceButton, pressed && styles.replaceButtonPressed]}
        >
          <MaterialIcons name="refresh" size={17} color="#777181" />
          <Text style={styles.replaceButtonText}>Replace QR key</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8F7FC" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22 },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1 },
  eyebrow: { color: "#7057E8", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 3 },
  title: { color: "#201C2B", fontSize: 28, fontWeight: "800", letterSpacing: -0.8 },
  qrShell: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  qrCard: { width: 310, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, alignItems: "center", shadowColor: "#251D4C", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  cardBrandRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  cardBrandMark: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#7057E8", alignItems: "center", justifyContent: "center" },
  cardBrand: { color: "#201C2B", fontSize: 16, fontWeight: "800" },
  qrCodeFrame: { padding: 10, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E9E6F0" },
  cardTitle: { color: "#201C2B", fontSize: 19, fontWeight: "800", marginTop: 19 },
  cardInstruction: { color: "#777181", fontSize: 13, marginTop: 5 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: 16, backgroundColor: "#EFECFF", marginBottom: 16 },
  tipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, color: "#5E557E", fontSize: 12, lineHeight: 18 },
  shareButton: { height: 58, borderRadius: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8", shadowColor: "#7057E8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  shareButtonPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  shareButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  replaceButton: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13, paddingHorizontal: 12, paddingVertical: 6 },
  replaceButtonPressed: { opacity: 0.6 },
  replaceButtonText: { color: "#777181", fontSize: 13, fontWeight: "600" },
});
