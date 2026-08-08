import { useSettings } from "@/hooks/use-settings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { selectedAppCount, selectBlockedApps, requestEmergencyUnlock } = useSettings();

  return (
    <SafeAreaView style={styles.safeArea}>
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
            onPress={selectBlockedApps}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Choose apps</Text>
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
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  primaryIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EFECFF", alignItems: "center", justifyContent: "center" },
  dangerIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#FFF0EC", alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1 },
  cardTitle: { color: "#201C2B", fontSize: 19, fontWeight: "800" },
  cardDescription: { color: "#6E687A", fontSize: 14, lineHeight: 21, marginTop: 5 },
  primaryButton: { height: 50, borderRadius: 15, marginTop: 20, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#7057E8" },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  dangerButton: { height: 50, borderRadius: 15, marginTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF0EC", borderWidth: 1, borderColor: "#F2CFC7" },
  dangerButtonText: { color: "#D85C4A", fontSize: 15, fontWeight: "700" },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  securityNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 24 },
  securityNoteText: { color: "#888397", fontSize: 12 },
});
