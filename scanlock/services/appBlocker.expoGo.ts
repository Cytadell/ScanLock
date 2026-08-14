import type { BlockedAppSelection, BlockingResult } from "@/modules/app-blocker";

const PLACEHOLDER_SELECTION: BlockedAppSelection = {
  count: 3,
  applicationCount: 3,
  categoryCount: 0,
  webDomainCount: 0,
};

let selectedAppCount = 0;
let blockingEnabled = false;

export const expoGoAppBlocker = {
  async requestAuthorization(): Promise<boolean> {
    return true;
  },

  async selectApps(): Promise<BlockedAppSelection> {
    if (blockingEnabled) {
      throw new Error("Unlock ScanLock before changing the blocked app selection.");
    }
    selectedAppCount = PLACEHOLDER_SELECTION.count;
    return PLACEHOLDER_SELECTION;
  },

  isAuthorized(): boolean {
    return true;
  },

  getSelectedAppCount(): number {
    return selectedAppCount;
  },

  hasSelection(): boolean {
    return selectedAppCount > 0;
  },

  getLocked(): boolean {
    return blockingEnabled;
  },

  async setBlockingEnabled(enabled: boolean): Promise<BlockingResult> {
    blockingEnabled = enabled;
    return {
      status: enabled ? "locked" : "unlocked",
      locked: enabled,
    };
  },

  async clearSelection(): Promise<void> {
    blockingEnabled = false;
    selectedAppCount = 0;
  },

};
