import { EmergencyUnlockModal } from "@/components/emergency/EmergencyUnlockModal";
import { ChooseAppsFirstModal } from "@/components/scanner/ChooseAppsFirstModal";
import { LockStatusCard } from "@/components/scanner/LockStatusCard";
import { ScannerView } from "@/components/scanner/ScannerView";
import { useLockScanner } from "@/hooks/use-lock-scanner";
import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const scanner = useLockScanner();

  if (scanner.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator accessibilityLabel="Loading ScanLock status" size="large" color="#7057E8" />
      </View>
    );
  }

  if (scanner.isOpen) {
    return (
      <Modal
        animationType="slide"
        presentationStyle="fullScreen"
        visible
        onRequestClose={scanner.close}
      >
        <ScannerView
          status={scanner.status}
          locked={scanner.locked}
          torchEnabled={scanner.torchEnabled}
          errorMessage={scanner.errorMessage}
          onBarcodeScanned={scanner.handleBarcodeScanned}
          onToggleTorch={scanner.toggleTorch}
          onRetry={scanner.retry}
          onClose={scanner.close}
        />
      </Modal>
    );
  }

  return (
    <>
      <EmergencyUnlockModal
        locked={scanner.locked}
        visible={scanner.emergencyUnlockVisible}
        countdown={scanner.emergencyUnlockCountdown}
        changing={scanner.emergencyUnlockChanging}
        onCancel={scanner.cancelEmergencyUnlock}
        onConfirm={scanner.performEmergencyUnlock}
      />
      <ChooseAppsFirstModal
        visible={scanner.chooseAppsFirstVisible}
        choosing={scanner.isChoosingApps}
        onChooseApps={scanner.chooseAppsFromPrompt}
        onDismiss={scanner.dismissChooseAppsFirst}
      />
      <LockStatusCard
        locked={scanner.locked}
        lockElapsed={scanner.lockElapsed}
        onScan={scanner.open}
        onEmergencyUnlock={scanner.requestEmergencyUnlock}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F6FB",
  },
});
