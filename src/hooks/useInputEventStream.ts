import { useEffect, useState } from "react";

import * as tauri from "@/services/tauri";
import type { InputEventLine } from "@/types";

const MAX_LINES = 400;

const isHidMotionOnly = (line: InputEventLine): boolean => {
  if (line.source !== "hid" || line.kind !== "hidReport") {
    return false;
  }
  if (line.summary.includes("wheel=") || line.summary.includes("pan=")) {
    return false;
  }
  if (!line.summary.includes("[—]")) {
    return false;
  }
  return line.summary.includes("Δ(");
};

export const useInputEventStream = (active: boolean) => {
  const [lines, setLines] = useState<InputEventLine[]>([]);
  const [latest, setLatest] = useState<InputEventLine | null>(null);
  const [hidMotion, setHidMotion] = useState(false);
  useEffect(() => {
    if (!active) {
      void tauri.setInputEventMonitorEnabled(false);
      return;
    }
    void tauri.setInputEventMonitorEnabled(true);
    let cancelled = false;
    const unlistenPromise = import("@tauri-apps/api/event").then(({ listen }) =>
      listen<InputEventLine>("input-event", (event) => {
        if (cancelled) {
          return;
        }
        const line = event.payload;
        if (!hidMotion && isHidMotionOnly(line)) {
          return;
        }
        setLatest(line);
        setLines((previous) => {
          const next = [...previous, line];
          if (next.length > MAX_LINES) {
            return next.slice(next.length - MAX_LINES);
          }
          return next;
        });
      }),
    );
    return () => {
      cancelled = true;
      void tauri.setInputEventMonitorEnabled(false);
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, [active, hidMotion]);

  const clear = () => {
    setLines([]);
    setLatest(null);
  };

  return {
    lines,
    latest,
    hidMotion,
    setHidMotion,
    clear,
  };
};
