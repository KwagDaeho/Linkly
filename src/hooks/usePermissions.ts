import { publishToast } from "@/components/ui/toast/toastBus";
import { usePrefs } from "@/hooks/prefs";
import { useCallback, useEffect, useRef, useState } from "react";
import { PERMISSION_POLL_IDLE_MS, PERMISSION_POLL_MS } from "../constants/polling";
import { pinPermissionPanelInDev, skipPermissionRelaunchInDev } from "../constants/devUi";
import * as tauri from "../services/tauri";
import type { PermissionStatus } from "../types";

const RESTART_TOAST_DELAY_MS = 400;

const permissionStatusEqual = (
  left: PermissionStatus | null,
  right: PermissionStatus,
): boolean =>
  left !== null &&
  left.accessibility === right.accessibility &&
  left.inputMonitoring === right.inputMonitoring &&
  left.postEvent === right.postEvent &&
  left.ready === right.ready;

export const usePermissions = () => {
  const { i18n } = usePrefs();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [permissionRestarting, setPermissionRestarting] = useState(false);
  const sawUntrusted = useRef(false);
  const restartScheduled = useRef(false);
  const trusted = permissionStatus !== null && permissionStatus.ready;
  const permissionGateVisible =
    pinPermissionPanelInDev || (permissionStatus !== null && (!permissionStatus.ready || permissionRestarting));

  const scheduleRelaunch = useCallback(() => {
    if (restartScheduled.current) {
      return;
    }
    restartScheduled.current = true;
    setPermissionRestarting(true);
    publishToast(i18n.accessibilityRestartToast);
    window.setTimeout(() => {
      void tauri.relaunchApp().catch(() => {
        publishToast(i18n.accessibilityRestartFailed);
        restartScheduled.current = false;
        setPermissionRestarting(false);
      });
    }, RESTART_TOAST_DELAY_MS);
  }, [i18n.accessibilityRestartToast, i18n.accessibilityRestartFailed]);

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
      if (skipPermissionRelaunchInDev) {
        return;
      }
      scheduleRelaunch();
    }
  }, [permissionStatus, scheduleRelaunch]);

  useEffect(() => {
    void refresh();
    let intervalId = 0;
    const tick = () => {
      void tauri.getPermissionStatus().then((next) => {
        setPermissionStatus((previous) =>
          permissionStatusEqual(previous, next) ? previous : next,
        );
      });
    };
    const arm = (ms: number) => {
      if (intervalId !== 0) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(tick, ms);
    };
    arm(permissionGateVisible ? PERMISSION_POLL_MS : PERMISSION_POLL_IDLE_MS);
    return () => {
      if (intervalId !== 0) {
        window.clearInterval(intervalId);
      }
    };
  }, [refresh, permissionGateVisible]);

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
