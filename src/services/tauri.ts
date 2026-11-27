/**
 * Sole FE boundary for Tauri `invoke` calls.
 * Command strings / payloads match `src-tauri` + current App.tsx usage.
 */
import { invoke } from "@tauri-apps/api/core";
import { wireProfileForBackend } from "@/domain/profile/wireProfile";
import type { EventViewerChannel } from "@/domain/input/eventViewer";
import type {
  ButtonMeta,
  CaptureSession,
  InstalledApp,
  KeyboardInfo,
  PermissionKind,
  PermissionStatus,
  Profile,
} from "@/types";
export const getProfile = async (): Promise<Profile> => {
  return invoke<Profile>("get_profile");
};
export const saveProfile = async (profile: Profile): Promise<void> => {
  await invoke("save_profile", { profile: wireProfileForBackend(profile) });
};
export const setEventViewerChannel = async (channel: EventViewerChannel, enabled: boolean): Promise<void> => {
  await invoke("set_event_viewer_channel", { channel, enabled });
};
export const getPermissionStatus = async (): Promise<PermissionStatus> => {
  return invoke<PermissionStatus>("permission_status");
};
export const requestPermission = async (kind: PermissionKind): Promise<boolean> => {
  return invoke<boolean>(
    kind === "accessibility" ? "request_accessibility" : "request_input_monitoring",
  );
};
export const openAccessibilitySettings = async (): Promise<void> => {
  await invoke("open_accessibility_settings");
};
export const openInputMonitoringSettings = async (): Promise<void> => {
  await invoke("open_input_monitoring_settings");
};
export const relaunchApp = async (): Promise<void> => {
  await invoke("relaunch_app");
};
export const listInstalledApps = async (): Promise<InstalledApp[]> => {
  return invoke<InstalledApp[]>("list_installed_apps");
};
export const openUrl = async (url: string): Promise<void> => {
  const mod = await import("@tauri-apps/plugin-opener");
  await mod.openUrl(url);
};
export const buttonCatalog = async (): Promise<ButtonMeta[]> => {
  return invoke<ButtonMeta[]>("button_catalog");
};
export const applyCaptureSession = async (session: CaptureSession): Promise<void> => {
  await invoke("apply_capture_session", { session });
};
export const mergeComboCaptureToken = async (token: string): Promise<void> => {
  await invoke("merge_combo_capture_token", { token });
};
export const getAppIcon = async (path: string): Promise<string | null> => {
  return invoke<string | null>("get_app_icon", { path });
};
export const KEY_REMAP_CAPTURE_EVENT = "key-remap-capture";
export const listKeyboards = async (): Promise<KeyboardInfo[]> => {
  return invoke<KeyboardInfo[]>("list_keyboards");
};
/** One-shot physical key capture on `deviceKey` (any keyboard when null). */
export const setKeyRemapCapture = async (
  armed: boolean,
  deviceKey: string | null,
): Promise<void> => {
  await invoke("set_key_remap_capture", { armed, deviceKey });
};
export const autostartIsEnabled = async (): Promise<boolean> => {
  return invoke<boolean>("autostart_is_enabled");
};
export const autostartSet = async (on: boolean): Promise<boolean> => {
  return invoke<boolean>("set_autostart_enabled", { enabled: on });
};
export const syncNativeAccent = async (rgb: number): Promise<void> => {
  await invoke("set_accent_color", { rgb });
};
export const setGestureRecording = async (active: boolean): Promise<void> => {
  await invoke("set_gesture_recording", { active });
};
