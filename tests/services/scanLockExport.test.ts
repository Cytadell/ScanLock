import {
  createFoldableCardHtml,
  SCANLOCK_EXPORT_FILENAMES,
} from "@/services/scanLockExport";

jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(),
}));

describe("ScanLock foldable export", () => {
  it("uses stable user-facing filenames without cache versions", () => {
    expect(SCANLOCK_EXPORT_FILENAMES).toEqual({
      png: "scanlock-key.png",
      foldablePdf: "scanlock-foldable.pdf",
    });
  });

  it("recreates the measured Letter grid without the blue placeholder", () => {
    const html = createFoldableCardHtml("encoded-png");

    expect(html).toContain("width: 8.5in; height: 11in");
    expect(html).toContain("tr { height: 2.75in; }");
    expect(html).toContain("td { width: 4.25in; height: 2.75in");
    expect(html).toContain("border: 1.5pt solid #202020");
    expect(html.match(/<tr/g)).toHaveLength(4);
    expect(html.match(/<td/g)).toHaveLength(8);
    expect(html).toContain("max-width: 2.55in; max-height: 4in");
    expect(html).toContain("rotate(90deg)");
    expect(html).toContain("data:image/png;base64,encoded-png");
    expect(html).not.toMatch(/blue|#cfe2f3|rgb\(207/i);
  });
});
