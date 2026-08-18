import { expoGoAppBlocker } from "@/services/appBlocker.expoGo";

describe("Expo Go app blocker", () => {
  beforeEach(async () => {
    await expoGoAppBlocker.clearSelection();
  });

  it("selects placeholder apps and reports the selection", async () => {
    await expect(expoGoAppBlocker.selectApps()).resolves.toEqual({
      count: 3,
      applicationCount: 3,
      categoryCount: 0,
      webDomainCount: 0,
    });
    expect(expoGoAppBlocker.getSelectedAppCount()).toBe(3);
    expect(expoGoAppBlocker.hasSelection()).toBe(true);
  });

  it("moves between locked and unlocked states", async () => {
    await expect(expoGoAppBlocker.setBlockingEnabled(true)).resolves.toEqual({
      status: "locked",
      locked: true,
    });
    expect(expoGoAppBlocker.getLocked()).toBe(true);

    await expect(expoGoAppBlocker.setBlockingEnabled(false)).resolves.toEqual({
      status: "unlocked",
      locked: false,
    });
  });

  it("prevents selection changes while locked", async () => {
    await expoGoAppBlocker.setBlockingEnabled(true);

    await expect(expoGoAppBlocker.selectApps()).rejects.toThrow(
      "Unlock ScanLock before changing the blocked app selection."
    );
  });

  it("clears both selection and lock state", async () => {
    await expoGoAppBlocker.selectApps();
    await expoGoAppBlocker.setBlockingEnabled(true);

    await expoGoAppBlocker.clearSelection();

    expect(expoGoAppBlocker.hasSelection()).toBe(false);
    expect(expoGoAppBlocker.getLocked()).toBe(false);
  });
});
