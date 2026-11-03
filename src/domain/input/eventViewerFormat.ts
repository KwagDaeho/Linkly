import type { Lang } from "@/types";
import {
  formatGenericModifierWord,
  formatSidedModifierWord,
} from "@/domain/keys/modifierLabel";

/** Viewer row labels — plain text in `[ name ] Up/Down` (not chord pill symbols). */
export const formatViewerInputName = (token: string, lang: Lang): string => {
  const sided = formatSidedModifierWord(token, lang);
  if (sided !== null) {
    return sided;
  }
  const generic = formatGenericModifierWord(token);
  if (generic !== null) {
    return generic;
  }
  switch (token) {
    case "Left":
      return lang === "ko" ? "arrow(L)" : "arrow(l)";
    case "Right":
      return lang === "ko" ? "arrow(R)" : "arrow(r)";
    case "Up":
      return lang === "ko" ? "arrow(U)" : "arrow(u)";
    case "Down":
      return lang === "ko" ? "arrow(D)" : "arrow(d)";
    case "Escape":
      return "Escape";
    case "Return":
      return "Return";
    case "Space":
      return "Space";
    case "Tab":
      return "Tab";
    case "Delete":
      return "Delete";
    default:
      if (/^f\d+$/i.test(token)) {
        return token.toUpperCase();
      }
      if (token.startsWith("keycode_")) {
        return lang === "ko" ? `keycode(${token.slice(8)})` : `keycode(${token.slice(8)})`;
      }
      return token;
  }
};

export const formatViewerMouseButtonName = (
  part: string,
  lang: Lang,
): string => {
  const side = part.replace(/_/g, " ");
  if (lang === "ko") {
    return `mouse(${side})`;
  }
  return `mouse(${side})`;
};

export const formatViewerBracketPhase = (
  name: string,
  phase: "down" | "up",
): string => {
  const phaseLabel = phase === "down" ? "Down" : "Up";
  return `[ ${name} ] ${phaseLabel}`;
};
