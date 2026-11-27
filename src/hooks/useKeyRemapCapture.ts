import { useEffect, useRef } from "react";

import {
  KEY_REMAP_CAPTURE_EVENT,
  setKeyRemapCapture,
  type KeyRemapCapture,
} from "@/services/tauri";

/**
 * While `session` is non-null, capture the next physical key on `deviceKey` (any
 * keyboard when null) and hand its HID usage to `onKey`. Capture is one-shot in Rust,
 * so every new `session` value re-arms it. Disarms on unmount / when `session` is null.
 */
export const useKeyRemapCapture = (
  session: string | null,
  deviceKey: string | null,
  onKey: (capture: KeyRemapCapture) => void,
) => {
  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;

  useEffect(() => {
    if (session === null) {
      return;
    }
    let disposed = false;
    const unlisten = import("@tauri-apps/api/event").then(({ listen }) =>
      listen<KeyRemapCapture>(KEY_REMAP_CAPTURE_EVENT, (event) => {
        if (!disposed) {
          onKeyRef.current(event.payload);
        }
      }),
    );
    void unlisten.then(() => {
      if (!disposed) {
        void setKeyRemapCapture(true, deviceKey);
      }
    });
    return () => {
      disposed = true;
      void setKeyRemapCapture(false, null);
      void unlisten.then((stop) => stop());
    };
  }, [session, deviceKey]);
};
