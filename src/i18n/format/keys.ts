import type { Lang } from "@/types";
import { normalizeKeys } from "@/domain/keys";
import { formatMouseKeyToken } from "@/domain/keys/mouseKeyToken";

export const formatKeyTokenLabel = (token: string, lang: Lang): string => {
  const mouseLabel = formatMouseKeyToken(token, lang);
  if (mouseLabel !== null) {
    return mouseLabel;
  }
  switch (token) {
    case "Meta":
      return "⌘";
    case "LeftMeta":
      return lang === "ko" ? "⌘L" : "⌘L";
    case "RightMeta":
      return lang === "ko" ? "⌘R" : "⌘R";
    case "Option":
      return "⌥";
    case "LeftOption":
      return lang === "ko" ? "⌥L" : "⌥L";
    case "RightOption":
      return lang === "ko" ? "⌥R" : "⌥R";
    case "Control":
      return "⌃";
    case "LeftControl":
      return lang === "ko" ? "⌃L" : "⌃L";
    case "RightControl":
      return lang === "ko" ? "⌃R" : "⌃R";
    case "Shift":
      return "⇧";
    case "LeftShift":
      return lang === "ko" ? "⇧L" : "⇧L";
    case "RightShift":
      return lang === "ko" ? "⇧R" : "⇧R";
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
    default:
      if (token.startsWith("keycode_")) {
        return lang === "ko" ? `키코드 ${token.slice(8)}` : `Key ${token.slice(8)}`;
      }
      return token;
  }
};

export const formatKeyChord = (keys: string[], lang: Lang): string => {
  const parts = normalizeKeys(keys).map((k) => formatKeyTokenLabel(k, lang));
  return parts.join("");
};
