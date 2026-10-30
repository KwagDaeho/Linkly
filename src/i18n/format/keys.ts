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
    case "Option":
      return "⌥";
    case "Control":
      return "⌃";
    case "Shift":
      return "⇧";
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
