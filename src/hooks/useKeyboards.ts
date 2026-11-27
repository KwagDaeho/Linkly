import { useEffect, useState } from "react";

import { listKeyboards } from "@/services/tauri";
import type { KeyboardInfo } from "@/types";

const POLL_MS = 2000;

/** Connected keyboards, polled while `active` (keyboard tab visible). */
export const useKeyboards = (active: boolean): KeyboardInfo[] => {
  const [keyboards, setKeyboards] = useState<KeyboardInfo[]>([]);
  useEffect(() => {
    if (!active) {
      return;
    }
    let alive = true;
    const load = () =>
      void listKeyboards()
        .then((next) => {
          if (alive) {
            setKeyboards((prev) =>
              JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
            );
          }
        })
        .catch(() => {});
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [active]);
  return keyboards;
};
