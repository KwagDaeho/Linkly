import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

import { INPUT_DEVICES_POLL_MS } from "@/constants/polling";
import type { InputDeviceStatus } from "@/types";

type InputDevicesContextValue = {
  devices: InputDeviceStatus[];
  error: string | null;
};

const InputDevicesContext = createContext<InputDevicesContextValue | null>(
  null,
);

const deviceListSignature = (list: InputDeviceStatus[]): string =>
  list
    .map(
      (device) =>
        `${device.vendorId}:${device.productId}:${device.connected ? 1 : 0}:${device.activeTransport ?? ""}`,
    )
    .join("|");

type InputDevicesProviderProps = {
  children: ReactNode;
  /** Poll only on Trigger tab (device list UI). Off = no list_devices IPC. */
  pollEnabled: boolean;
};

export const InputDevicesProvider = ({
  children,
  pollEnabled,
}: InputDevicesProviderProps) => {
  const [devices, setDevices] = useState<InputDeviceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pollEnabled) {
      return;
    }

    let cancelled = false;
    let intervalId = 0;
    let windowVisible = true;

    const refresh = async () => {
      if (cancelled || !pollEnabled) {
        return;
      }
      try {
        const visible = await getCurrentWindow().isVisible();
        windowVisible = visible;
        if (!visible) {
          return;
        }
        const list = await invoke<InputDeviceStatus[]>("list_devices");
        if (cancelled) {
          return;
        }
        setDevices((previous) =>
          deviceListSignature(previous) === deviceListSignature(list)
            ? previous
            : list,
        );
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setDevices([]);
          setError(String(err));
        }
      }
    };

    const armInterval = () => {
      if (intervalId !== 0) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(() => {
        void refresh();
      }, INPUT_DEVICES_POLL_MS);
    };

    void refresh();
    armInterval();

    const onVisibility = () => {
      if (document.visibilityState === "visible" && windowVisible) {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    let unlistenFocus: (() => void) | undefined;
    void getCurrentWindow()
      .onFocusChanged(({ payload: focused }) => {
        windowVisible = focused;
        if (focused) {
          void refresh();
        }
      })
      .then((off) => {
        if (cancelled) {
          off();
          return;
        }
        unlistenFocus = off;
      });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      unlistenFocus?.();
      if (intervalId !== 0) {
        window.clearInterval(intervalId);
      }
    };
  }, [pollEnabled]);

  return (
    <InputDevicesContext.Provider value={{ devices, error }}>
      {children}
    </InputDevicesContext.Provider>
  );
};

export const useInputDevices = (): InputDevicesContextValue => {
  const ctx = useContext(InputDevicesContext);
  if (ctx === null) {
    throw new Error("useInputDevices must be used within InputDevicesProvider");
  }
  return ctx;
};
