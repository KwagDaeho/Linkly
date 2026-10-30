import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { invoke } from "@tauri-apps/api/core";
import type { InputDeviceStatus } from "@/types";

const POLL_MS = 1000;

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

export const InputDevicesProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<InputDeviceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
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

    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
