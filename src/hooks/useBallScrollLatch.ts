import { useEffect, useState } from "react";

/** Live ball-scroll latch from the remapper (Trackball accordion status). */
export const useBallScrollLatch = () => {
  const [latchOn, setLatchOn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const unlisten = import("@tauri-apps/api/event").then(({ listen }) =>
      listen<{ active: boolean; latch: boolean }>(
        "ball-scroll-active",
        (event) => {
          if (!cancelled) {
            setLatchOn(event.payload.latch);
          }
        },
      ),
    );
    return () => {
      cancelled = true;
      void unlisten.then((unsubscribe) => unsubscribe());
    };
  }, []);
  return latchOn;
};
