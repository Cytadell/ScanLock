import { PadlockQrCodeIcon } from "@/components/icons/PadlockQrCodeIcon";
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type Props = {
  qrPayload: string;
  width: number;
  qrSize: number;
  showBrand?: boolean;
};

export const QrKeyCard = forwardRef<View, Props>(function QrKeyCard(
  { qrPayload, width, qrSize, showBrand = false },
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
      {showBrand && <BrandLockup />}

      <View style={styles.qrCodeFrame}>
        <QRCode value={qrPayload} size={qrSize} color="#201C2B" backgroundColor="#FFFFFF" />
      </View>

      <View style={styles.portraitCopy}>
        <Text style={styles.title}>Your ScanLock key</Text>
        <Text style={styles.instruction}>Keep this code away from your phone</Text>
      </View>
    </View>
  );
});

function BrandLockup() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <PadlockQrCodeIcon color="#FFFFFF" height={18} />
      </View>
      <Text style={styles.brand}>ScanLock</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, alignItems: "center", shadowColor: "#251D4C", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  qrCodeFrame: { padding: 10, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E9E6F0" },
  portraitCopy: { width: "100%", alignItems: "center" },
  brandRow: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  brandMark: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#7057E8" },
  brand: { color: "#201C2B", fontSize: 16, fontWeight: "800" },
  title: { color: "#201C2B", fontSize: 18, fontWeight: "800", marginTop: 14, textAlign: "center" },
  instruction: { color: "#5F596B", fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: "center" },
});
