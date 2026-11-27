import type { Lang } from "@/types";
import { normalizeKeys } from "@/domain/keys";
import {
  formatGenericModifierIcon,
  formatSidedModifierIcon,
} from "@/domain/keys/modifierLabel";
import { mouseButtonNumberLabel } from "@/domain/profile/mouseButton";
import { buttonLabel } from "../translate";

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

const formatMouseKeyToken = (token: string, lang: Lang): string | null => {
  const buttonId = CAPTURE_MOUSE_TO_BUTTON_ID[token];
  if (buttonId !== undefined) {
    return buttonLabel(buttonId, lang);
  }
  if (token.startsWith("Button")) {
    return mouseButtonNumberLabel(token.slice("Button".length), lang);
  }
  return null;
};

export const formatKeyTokenLabel = (token: string, lang: Lang): string => {
  const mouseLabel = formatMouseKeyToken(token, lang);
  if (mouseLabel !== null) {
    return mouseLabel;
  }
  const sided = formatSidedModifierIcon(token);
  if (sided !== null) {
    return sided;
  }
  const generic = formatGenericModifierIcon(token);
  if (generic !== null) {
    return generic;
  }
  switch (token) {
    case "Left":
      return "←";
    case "Right":
      return "→";
    case "Up":
      return "↑";
    case "Down":
      return "↓";
    case "Escape":
      return "Esc";
    case "Return":
      return "Enter/Return";
    case "Space":
      return lang === "ko" ? "스페이스" : "Space";
    case "ForwardDelete":
      return "Delete ⌦";
    case "Delete":
      return "Backspace ⌫";
    case "PageUp":
      return "Page Up";
    case "PageDown":
      return "Page Down";
    default:
      if (/^f\d+$/i.test(token)) {
        return token.toUpperCase();
      }
      if (token.startsWith("keycode_")) {
        return lang === "ko" ? `키코드 ${token.slice(8)}` : `Key ${token.slice(8)}`;
      }
      return token;
  }
};

export const formatKeyChord = (keys: string[], lang: Lang): string => {
  const parts = normalizeKeys(keys).map((k) => formatKeyTokenLabel(k, lang));
  return parts.join("+");
};
