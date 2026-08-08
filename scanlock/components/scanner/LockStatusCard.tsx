import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

type Props = {
  locked: boolean;
  onScan: () => void;
};

export function LockStatusCard({ locked, onScan }: Props) {
  const accent = locked ? "#E46C55" : "#16A079";
  const tint = locked ? "#FFF0EC" : "#E9F8F3";

  function handlePress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onScan();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <MaterialIcons name="qr-code-2" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>ScanLock</Text>
        </View>

        <View style={[styles.glow, { backgroundColor: tint }]} />

        <View style={styles.content}>
          <View style={[styles.lockCircle, { backgroundColor: tint }]}>
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

          <Text style={styles.title}>
            Your apps are {locked ? "locked" : "available"}
          </Text>
          <Text style={styles.subtitle}>
            {locked
              ? "Scan a QR code when you’re ready to get access again."
              : "Ready to focus? Scan a QR code to block your selected apps."}
          </Text>
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
          <View style={styles.secureRow}>
            <MaterialIcons name="verified-user" size={15} color="#888397" />
            <Text style={styles.secureText}>Changes only happen after a successful scan</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 22, overflow: "hidden" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#7057E8" },
  brand: { color: "#201C2B", fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  glow: { position: "absolute", width: 420, height: 420, borderRadius: 210, top: 90, alignSelf: "center", opacity: 0.75 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 18 },
  lockCircle: { width: 178, height: 178, borderRadius: 89, alignItems: "center", justifyContent: "center", marginBottom: 28 },
  lockCircleInner: { width: 126, height: 126, borderRadius: 63, alignItems: "center", justifyContent: "center", shadowColor: "#16121F", shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, marginBottom: 16 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#201C2B", fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1, textAlign: "center", maxWidth: 330 },
  subtitle: { color: "#6E687A", fontSize: 16, lineHeight: 24, textAlign: "center", maxWidth: 330, marginTop: 12 },
  footer: { gap: 16 },
  scanButton: { height: 58, borderRadius: 18, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8", shadowColor: "#7057E8", shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  scanButtonPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  scanButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  secureRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  secureText: { color: "#888397", fontSize: 12 },
});
