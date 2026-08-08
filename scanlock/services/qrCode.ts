import AsyncStorage from "@react-native-async-storage/async-storage";

const QR_ID_KEY = "qr-brick:qrId";

export async function getOrCreateQrId(): Promise<string> {
  const savedId = await AsyncStorage.getItem(QR_ID_KEY);

  if (savedId) return savedId;

  const newId = generateQrId();
  await AsyncStorage.setItem(QR_ID_KEY, newId);
  return newId;
}

function generateQrId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
}
