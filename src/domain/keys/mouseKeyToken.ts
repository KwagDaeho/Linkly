import type { Activator } from "@/types";
import { buttonLabel } from "@/i18n/translate";

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

const HUGE_BUTTON_TOKEN: Record<string, string> = {
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

/** Capture / pill labels — same SSOT as button mapping `buttons.*`. */
const CAPTURE_MOUSE_TO_BUTTON_ID: Record<string, string> = {
  MouseLeft: "left",
  MouseRight: "right",
  MouseMiddle: "middle",
  MouseBack: "back",
  MouseForward: "forward",
  Fn1: "fn1",
  Fn2: "fn2",
  Fn3: "fn3",
  WheelTiltLeft: "wheel_tilt_left",
  WheelTiltRight: "wheel_tilt_right",
};

/** Token for chord-hold capture (keyboard + mouse + trackball). */
export const activatorToCaptureToken = (
  activator: Activator,
): string | null => {
  if (activator.type === "key") {
    return activator.name;
  }
  if (activator.type === "huge") {
    return HUGE_BUTTON_TOKEN[activator.button] ?? null;
  }
  return activatorToCustomKeyToken(activator);
};

/** Serialize a captured mouse activator into a custom-key / keystroke token. */
export const activatorToCustomKeyToken = (
  activator: Activator,
): string | null => {
  if (activator.type === "huge") {
    return HUGE_BUTTON_TOKEN[activator.button] ?? null;
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

export const formatMouseKeyToken = (
  token: string,
  lang: "ko" | "en",
): string | null => {
  const buttonId = CAPTURE_MOUSE_TO_BUTTON_ID[token];
  if (buttonId !== undefined) {
    return buttonLabel(buttonId, lang);
  }
  if (token.startsWith("Button")) {
    const n = token.slice("Button".length);
    return lang === "ko" ? `버튼 ${n}` : `Button ${n}`;
  }
  return null;
};
