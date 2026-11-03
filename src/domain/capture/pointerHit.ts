export const CAPTURE_CANCEL_ATTR = "data-capture-cancel";
export const CAPTURE_IGNORE_ACTIVATOR_ATTR = "data-capture-ignore-activator";

let lastClientX = 0;
let lastClientY = 0;
let tracking = false;

const syncPointer = (event: MouseEvent | PointerEvent) => {
  lastClientX = event.clientX;
  lastClientY = event.clientY;
};

export const ensurePointerHitTracking = () => {
  if (tracking || typeof window === "undefined") {
    return;
  }
  tracking = true;
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  window.addEventListener("mousemove", syncPointer, opts);
  window.addEventListener("pointerdown", syncPointer, opts);
};

export const hitCaptureIgnoresActivatorsAtPointer = (): boolean => {
  const target = document.elementFromPoint(lastClientX, lastClientY);
  if (target === null) {
    return false;
  }
  return (
    target.closest(`[${CAPTURE_IGNORE_ACTIVATOR_ATTR}]`) !== null ||
    target.closest("[data-mapping-trigger]") !== null
  );
};

export const hitCaptureCancelAtPointer = (): boolean => {
  const target = document.elementFromPoint(lastClientX, lastClientY);
  if (target === null) {
    return false;
  }
  return target.closest(`[${CAPTURE_CANCEL_ATTR}]`) !== null;
};
