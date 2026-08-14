import { NativeModule, requireNativeModule } from "expo";

import type { BlockedAppSelection } from "./AppBlocker.types";

declare class AppBlockerModule extends NativeModule {
  requestAuthorization(): Promise<boolean>;
  selectApps(): Promise<BlockedAppSelection>;
  isAuthorized(): boolean;
  getSelectedAppCount(): number;
  hasSelection(): boolean;
  getLocked(): boolean;
  enableBlocking(): Promise<void>;
  disableBlocking(): Promise<void>;
  clearSelection(): Promise<void>;
}

export default requireNativeModule<AppBlockerModule>("AppBlocker");
