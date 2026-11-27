import { useEffect, useRef, type RefObject } from "react";

/**
 * While `enabled`, calls `onDismiss` on a pointer press outside every element in
 * `refs`, or on Escape. `capture` listens for the press in the capture phase (before
 * handlers that stop propagation).
 */
export const useDismiss = (
  refs: readonly RefObject<HTMLElement | null>[],
  onDismiss: () => void,
  enabled: boolean,
  options: { capture?: boolean } = {},
) => {
  const refsRef = useRef(refs);
  refsRef.current = refs;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const capture = options.capture === true;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const dismissIfOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (refsRef.current.some((ref) => ref.current?.contains(target))) {
        return;
      }
      onDismissRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismissRef.current();
      }
    };
    window.addEventListener("pointerdown", dismissIfOutside, capture);
    window.addEventListener("mousedown", dismissIfOutside, capture);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", dismissIfOutside, capture);
      window.removeEventListener("mousedown", dismissIfOutside, capture);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled, capture]);
};
