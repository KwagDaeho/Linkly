import { publishToast } from "@/components/ui/toast/toastBus";
import { usePrefs } from "@/hooks/prefs";
import { useCallback, useEffect, useRef, useState } from "react";
import { PERMISSION_POLL_MS } from "../constants/polling";
import * as tauri from "../services/tauri";
import type { PermissionStatus } from "../types";

const RESTART_TOAST_DELAY_MS = 400;

export const usePermissions = () => {
  const { i18n } = usePrefs();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);
  const [permissionRestarting, setPermissionRestarting] = useState(false);
  const sawUntrusted = useRef(false);
  const restartScheduled = useRef(false);
  const trusted = permissionStatus !== null && permissionStatus.ready;
  const permissionGateVisible =
    permissionStatus !== null &&
    (!permissionStatus.ready || permissionRestarting);

  const scheduleRelaunch = useCallback(() => {
    if (restartScheduled.current) {
      return;
    }
    restartScheduled.current = true;
    setPermissionRestarting(true);
    publishToast(i18n.accessibilityRestartToast);
    window.setTimeout(() => {
      void tauri.relaunchApp();
    }, RESTART_TOAST_DELAY_MS);
  }, [i18n.accessibilityRestartToast]);

  const refresh = useCallback(async () => {
    setPermissionStatus(await tauri.getPermissionStatus());
  }, []);

  useEffect(() => {
    if (permissionStatus === null) {
      return;
    }
    if (!permissionStatus.ready) {
      sawUntrusted.current = true;
      return;
    }
    if (sawUntrusted.current) {
      scheduleRelaunch();
    }
  }, [permissionStatus, scheduleRelaunch]);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      void tauri.getPermissionStatus().then(setPermissionStatus);
    }, PERMISSION_POLL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refresh]);

  const grantAccess = useCallback(async () => {
    await tauri.requestPermission("accessibility");
    const next = await tauri.getPermissionStatus();
    setPermissionStatus(next);
    if (!next.ready) {
      await tauri.openAccessibilitySettings();
    }
  }, []);

  return {
    permissionStatus,
    trusted,
    permissionGateVisible,
    permissionRestarting,
    refresh,
    grantAccess,
    openAccessibilitySettings: tauri.openAccessibilitySettings,
    openInputMonitoringSettings: tauri.openInputMonitoringSettings,
  };
};
