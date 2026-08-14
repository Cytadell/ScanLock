import type { BlockedAppSelection } from "@/modules/app-blocker";

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

  async enableBlocking(): Promise<void> {
    blockingEnabled = true;
  },

  async disableBlocking(): Promise<void> {
    blockingEnabled = false;
  },

  async clearSelection(): Promise<void> {
    blockingEnabled = false;
    selectedAppCount = 0;
  },

};
