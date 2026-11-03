import type { Lang } from "@/types";

/** Viewer row labels — plain text in `[ name ] Up/Down` (not chord pill symbols). */
export const formatViewerInputName = (token: string, lang: Lang): string => {
  switch (token) {
    case "LeftMeta":
      return lang === "ko" ? "command(Left)" : "command(left)";
    case "RightMeta":
      return lang === "ko" ? "command(Right)" : "command(right)";
    case "Meta":
      return "command";
    case "LeftOption":
      return lang === "ko" ? "option(Left)" : "option(left)";
    case "RightOption":
      return lang === "ko" ? "option(Right)" : "option(right)";
    case "Option":
      return "option";
    case "LeftControl":
      return lang === "ko" ? "control(Left)" : "control(left)";
    case "RightControl":
      return lang === "ko" ? "control(Right)" : "control(right)";
    case "Control":
      return "control";
    case "LeftShift":
      return lang === "ko" ? "shift(Left)" : "shift(left)";
    case "RightShift":
      return lang === "ko" ? "shift(Right)" : "shift(right)";
    case "Shift":
      return "shift";
    case "Left":
      return lang === "ko" ? "arrow(Left)" : "arrow(left)";
    case "Right":
      return lang === "ko" ? "arrow(Right)" : "arrow(right)";
    case "Up":
      return lang === "ko" ? "arrow(Up)" : "arrow(up)";
    case "Down":
      return lang === "ko" ? "arrow(Down)" : "arrow(down)";
    case "Escape":
      return "Escape";
    case "Return":
      return lang === "ko" ? "Return" : "Return";
    case "Space":
      return lang === "ko" ? "Space" : "Space";
    case "Tab":
      return "Tab";
    case "Delete":
      return lang === "ko" ? "Delete" : "Delete";
    default:
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
