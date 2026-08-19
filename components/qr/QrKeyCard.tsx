import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = {
  qrPayload: string;
  width: number;
  qrSize: number;
};

export const QrKeyCard = forwardRef<View, Props>(function QrKeyCard(
  { qrPayload, width, qrSize },
  ref
) {
  return (
    <View
      ref={ref}
      accessible
      accessibilityLabel="Your ScanLock QR key. Keep this code away from your phone."
      collapsable={false}
      style={[styles.card, { width }]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <MaterialIcons name="lock" size={16} color="#FFFFFF" />
        </View>
        <Text style={styles.brand}>ScanLock</Text>
      </View>

      <View style={styles.qrCodeFrame}>
        <QRCode value={qrPayload} size={qrSize} color="#201C2B" backgroundColor="#FFFFFF" />
      </View>

      <Text style={styles.title}>Your ScanLock key</Text>
      <Text style={styles.instruction}>Keep this code away from your phone</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 28, padding: 24, alignItems: "center", shadowColor: "#251D4C", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  brandRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  brandMark: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#7057E8", alignItems: "center", justifyContent: "center" },
  brand: { color: "#201C2B", fontSize: 16, fontWeight: "800" },
  qrCodeFrame: { padding: 10, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E9E6F0" },
  title: { color: "#201C2B", fontSize: 19, fontWeight: "800", marginTop: 19 },
  instruction: { color: "#5F596B", fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: "center" },
});
