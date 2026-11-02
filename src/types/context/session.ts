import type { DeviceInfo, LastReport } from "../device";
import type { PermissionStatus } from "../ui";

export type SessionAutostart = {
  enabled: boolean;
  setEnabled: (on: boolean) => Promise<void>;
};

export type SessionContextValue = {
  connected: DeviceInfo | null;
  report: LastReport | null;
  trusted: boolean;
  permissionGateVisible: boolean;
  permissionRestarting: boolean;
  permissionStatus: PermissionStatus | null;
  grantAccess: () => Promise<void>;
  openAccessibilitySettings: () => Promise<void>;
  autostart: SessionAutostart;
};
