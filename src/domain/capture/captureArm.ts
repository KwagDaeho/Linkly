/** Ignore HID activator assigns briefly after capture opens (same press as the UI click). */
export const CAPTURE_ACTIVATOR_ARM_MS = 220;

let armedUntil = 0;

export const armActivatorCaptureGrace = () => {
  armedUntil = Date.now() + CAPTURE_ACTIVATOR_ARM_MS;
};

export const activatorCaptureGraceActive = (): boolean =>
  Date.now() < armedUntil;
