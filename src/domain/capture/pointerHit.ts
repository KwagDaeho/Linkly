export const CAPTURE_CANCEL_ATTR = "data-capture-cancel";

let lastClientX = 0;
let lastClientY = 0;
let tracking = false;

const onMove = (event: MouseEvent) => {
  lastClientX = event.clientX;
  lastClientY = event.clientY;
};

export const ensurePointerHitTracking = () => {
  if (tracking || typeof window === "undefined") {
    return;
  }
  tracking = true;
  window.addEventListener("mousemove", onMove, { capture: true, passive: true });
};

export const hitCaptureCancelAtPointer = (): boolean => {
  const target = document.elementFromPoint(lastClientX, lastClientY);
  if (target === null) {
    return false;
  }
  return target.closest(`[${CAPTURE_CANCEL_ATTR}]`) !== null;
};
