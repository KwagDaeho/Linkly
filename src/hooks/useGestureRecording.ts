import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef } from "react";

import { setGestureRecording } from "@/services/tauri";
import type { GesturePoint } from "@/types/profile/gesture";

/** While mounted, the backend records gesture strokes and hands each to `onStroke`. */
export const useGestureRecording = (onStroke: (points: GesturePoint[]) => void) => {
  const onStrokeRef = useRef(onStroke);
  onStrokeRef.current = onStroke;

  useEffect(() => {
    void setGestureRecording(true).catch(() => undefined);
    const off = listen<GesturePoint[]>("gesture-recorded", (event) => {
      onStrokeRef.current(event.payload);
    });
    return () => {
      void off.then((un) => un());
      void setGestureRecording(false).catch(() => undefined);
    };
  }, []);
};
