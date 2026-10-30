import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import type { InputDeviceStatus } from "@/types";

const POLL_MS = 1000;

export const useInputDevices = () => {
  const [devices, setDevices] = useState<InputDeviceStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const list = await invoke<InputDeviceStatus[]>("list_devices");
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
