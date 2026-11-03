import type { Lang } from "@/types";
import { normalizeKeys } from "@/domain/keys";
import {
  formatGenericModifierIcon,
  formatSidedModifierIcon,
} from "@/domain/keys/modifierLabel";
import { formatMouseKeyToken } from "@/domain/keys/mouseKeyToken";

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
