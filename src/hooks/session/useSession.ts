import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfileCtx } from "@/hooks/profile";
import * as tauri from "@/services/tauri";
import type { SessionContextValue } from "@/types";

export const SessionContext = createContext<SessionContextValue | null>(null);

export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
};

export const useSessionState = (): SessionContextValue => {
  const { lifecycle } = useProfileCtx();
  const {
    trusted,
    grantAccess,
    permissionGateVisible,
    permissionRestarting,
    permissionStatus,
    openAccessibilitySettings,
  } = usePermissions();
  const [autostartEnabled, setAutostartEnabledState] = useState(false);

  useEffect(() => {
    void tauri.autostartIsEnabled().then(setAutostartEnabledState);
  }, []);

  const setAutostartEnabled = useCallback(
    async (on: boolean) => {
      try {
        setAutostartEnabledState(await tauri.autostartSet(on));
      } catch (error) {
        lifecycle.setBootError(String(error));
      }
    },
    [lifecycle],
  );

  return useMemo(
    (): SessionContextValue => ({
      trusted,
      grantAccess,
      permissionGateVisible,
      permissionRestarting,
      permissionStatus,
      openAccessibilitySettings,
      autostart: {
        enabled: autostartEnabled,
        setEnabled: setAutostartEnabled,
      },
    }),
    [
      autostartEnabled,
      grantAccess,
      openAccessibilitySettings,
      permissionGateVisible,
      permissionRestarting,
      permissionStatus,
      setAutostartEnabled,
      trusted,
    ],
  );
};
