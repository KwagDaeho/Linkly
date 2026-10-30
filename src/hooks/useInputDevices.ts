import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import type { DeviceInfo } from "@/types";

const POLL_MS = 5000;

export const useInputDevices = () => {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const list = await invoke<DeviceInfo[]>("list_devices");
        if (!cancelled) {
          setDevices(list);
          setError(null);
        }
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

  return { devices, error };
};
