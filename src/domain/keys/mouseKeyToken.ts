import type { Activator } from "@/types";

import {
  mouseButtonEventNumber,
  normalizeMouseButton,
} from "@/domain/profile/mouseButton";

const MOUSE_TOKEN: Record<string, string> = {
  left: "MouseLeft",
  right: "MouseRight",
  middle: "MouseMiddle",
  back: "MouseBack",
  forward: "MouseForward",
};

const CATALOG_BUTTON_TOKEN: Record<string, string> = {
  left: "MouseLeft",
  right: "MouseRight",
  middle: "MouseMiddle",
  back: "MouseBack",
  forward: "MouseForward",
  fn1: "Fn1",
  fn2: "Fn2",
  fn3: "Fn3",
  wheel_tilt_left: "WheelTiltLeft",
  wheel_tilt_right: "WheelTiltRight",
};

/** Token for chord-hold capture (keyboard + mouse + trackball). */
export const activatorToCaptureToken = (
  activator: Activator,
): string | null => {
  if (activator.type === "key") {
    return activator.name;
  }
  if (activator.type === "device") {
    return CATALOG_BUTTON_TOKEN[activator.button] ?? null;
  }
  return activatorToCustomKeyToken(activator);
};

/** Pill keys for a single-input trigger (null = unset / not displayable). */
export const activatorDisplayKeys = (activator: Activator | null): string[] | null => {
  if (activator === null) {
    return null;
  }
  const token = activatorToCaptureToken(activator);
  return token !== null ? [token] : null;
};

/** Serialize a captured mouse activator into a custom-key / keystroke token. */
export const activatorToCustomKeyToken = (
  activator: Activator,
): string | null => {
  if (activator.type === "device") {
    return CATALOG_BUTTON_TOKEN[activator.button] ?? null;
  }
  if (activator.type !== "mouse") {
    return null;
  }
  const normalized = normalizeMouseButton(activator.button);
  if (typeof normalized === "string") {
    return MOUSE_TOKEN[normalized] ?? null;
  }
  const cg = mouseButtonEventNumber(normalized);
  if (cg === null) {
    return null;
  }
  return `Button${cg + 1}`;
};
