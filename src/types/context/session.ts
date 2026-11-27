
import type { PermissionKind, PermissionStatus } from "../ui";

export type SessionAutostart = {
  enabled: boolean;
  setEnabled: (on: boolean) => Promise<void>;
};

export type SessionContextValue = {
  trusted: boolean;
  permissionGateVisible: boolean;
  permissionRestarting: boolean;
  permissionStatus: PermissionStatus | null;
  /** Show the macOS prompt for one permission. */
  requestPermission: (kind: PermissionKind) => Promise<void>;
  /** Open that permission's pane in System Settings. */
  openPermissionSettings: (kind: PermissionKind) => Promise<void>;
  autostart: SessionAutostart;
};
