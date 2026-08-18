import { NativeModule, requireNativeModule } from "expo";

import type { BlockedAppSelection, BlockingResult } from "./AppBlocker.types";

declare class AppBlockerModule extends NativeModule {
  requestAuthorization(): Promise<boolean>;
  selectApps(): Promise<BlockedAppSelection>;
  isAuthorized(): boolean;
  getSelectedAppCount(): number;
  hasSelection(): boolean;
  getLocked(): boolean;
  setBlockingEnabled(enabled: boolean): Promise<BlockingResult>;
  clearSelection(): Promise<void>;
}

export default requireNativeModule<AppBlockerModule>("AppBlocker");
