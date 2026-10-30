import type { Lang } from "@/types";
import { normalizeKeys } from "@/domain/keys";
import { formatMouseKeyToken } from "@/domain/keys/mouseKeyToken";

export const formatKeyChord = (keys: string[], lang: Lang): string => {
  const parts = normalizeKeys(keys).map((k) => {
    const mouseLabel = formatMouseKeyToken(k, lang);
    if (mouseLabel !== null) {
      return mouseLabel;
    }
    switch (k) {
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
        if (k.startsWith("keycode_")) {
          return lang === "ko" ? `키코드 ${k.slice(8)}` : `Key ${k.slice(8)}`;
        }
        return k;
    }
  });
  return parts.join("");
};
