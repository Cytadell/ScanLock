import { Directory, File, Paths } from "expo-file-system";
import * as Print from "expo-print";

const KEY_IMAGE_VERSION = 2;
const FOLDABLE_TEMPLATE_VERSION = 5;
const EXPORT_DIRECTORY_NAME = "scanlock-exports";
const EXPORT_SIGNATURE = `${KEY_IMAGE_VERSION}:${FOLDABLE_TEMPLATE_VERSION}`;

export const SCANLOCK_EXPORT_FILENAMES = {
  png: "scanlock-key.png",
  foldablePdf: "scanlock-foldable.pdf",
} as const;

type CaptureQrCard = () => Promise<string>;

type ExportFiles = {
  png: File;
  foldablePdf: File;
};

export async function getOrCreatePngExport(qrPayload: string, captureQrCard: CaptureQrCard) {
  const files = prepareExportFiles(qrPayload);

  if (!files.png.exists) {
    const captureUri = await captureQrCard();
    copyReplacing(new File(captureUri), files.png);
  }

  return files.png;
}

export async function getOrCreateFoldableExport(qrPayload: string, captureQrCard: CaptureQrCard) {
  const files = prepareExportFiles(qrPayload);

  if (!files.foldablePdf.exists) {
    const png = await getOrCreatePngExport(qrPayload, captureQrCard);
    const encodedImage = await png.base64();
    const { uri } = await Print.printToFileAsync({
      html: createFoldableCardHtml(encodedImage),
      width: 612,
      height: 792,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      textZoom: 100,
    });

    copyReplacing(new File(uri), files.foldablePdf);
  }

  return files.foldablePdf;
}

function prepareExportFiles(qrPayload: string): ExportFiles {
  const directory = new Directory(Paths.document, EXPORT_DIRECTORY_NAME);
  directory.create({ idempotent: true, intermediates: true });

  const files = {
    png: new File(directory, SCANLOCK_EXPORT_FILENAMES.png),
    foldablePdf: new File(directory, SCANLOCK_EXPORT_FILENAMES.foldablePdf),
  };
  const signatureMarker = new File(directory, "export-signature.txt");
  const expectedSignature = `${EXPORT_SIGNATURE}\n${qrPayload}`;
  const storedSignature = signatureMarker.exists ? signatureMarker.textSync() : null;

  if (storedSignature !== expectedSignature) {
    if (files.png.exists) files.png.delete();
    if (files.foldablePdf.exists) files.foldablePdf.delete();
    signatureMarker.create({ overwrite: true });
    signatureMarker.write(expectedSignature);
  }

  return files;
}

function copyReplacing(source: File, destination: File) {
  if (destination.exists) destination.delete();
  source.copy(destination);
}

export function createFoldableCardHtml(encodedImage: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @page { size: 8.5in 11in; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 8.5in; height: 11in; margin: 0; padding: 0; overflow: hidden; background: #ffffff; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { width: 8.5in; height: 11in; overflow: hidden; background: #ffffff; }
      table { width: 8.5in; height: 11in; border-collapse: collapse; table-layout: fixed; }
      tr { height: 2.75in; }
      td { width: 4.25in; height: 2.75in; padding: 0; border: 1.5pt solid #202020; }
      .qr-panel { position: relative; width: 100%; height: 100%; overflow: hidden; background: #ffffff; }
      .qr-panel img { position: absolute; top: 50%; left: 50%; display: block; max-width: 2.55in; max-height: 4in; width: auto; height: auto; transform: translate(-50%, -50%) rotate(90deg); transform-origin: center; }
    </style>
  </head>
  <body>
    <main class="sheet">
      <table aria-label="ScanLock foldable card template">
        <tbody>
          <tr>
            <td><div class="qr-panel"><img alt="ScanLock QR key" src="data:image/png;base64,${encodedImage}" /></div></td>
            <td></td>
          </tr>
          <tr><td></td><td></td></tr>
          <tr><td></td><td></td></tr>
          <tr><td></td><td></td></tr>
        </tbody>
      </table>
    </main>
  </body>
</html>`;
}
