import type { Lang } from "@/types";

/** Side suffix for L/R modifier keys — SSOT for UI, catalog, and viewer. */
export type ModifierSideLetter = "L" | "R";

type SidedModifierToken =
  | "LeftMeta"
  | "RightMeta"
  | "LeftOption"
  | "RightOption"
  | "LeftControl"
  | "RightControl"
  | "LeftShift"
  | "RightShift";

const SIDED: Record<
  SidedModifierToken,
  { word: string; icon: string; side: ModifierSideLetter }
> = {
  LeftMeta: { word: "command", icon: "⌘", side: "L" },
  RightMeta: { word: "command", icon: "⌘", side: "R" },
  LeftOption: { word: "option", icon: "⌥", side: "L" },
  RightOption: { word: "option", icon: "⌥", side: "R" },
  LeftControl: { word: "control", icon: "⌃", side: "L" },
  RightControl: { word: "control", icon: "⌃", side: "R" },
  LeftShift: { word: "shift", icon: "⇧", side: "L" },
  RightShift: { word: "shift", icon: "⇧", side: "R" },
};

const GENERIC: Record<string, { word: string; icon: string }> = {
  Meta: { word: "command", icon: "⌘" },
  Option: { word: "option", icon: "⌥" },
  Control: { word: "control", icon: "⌃" },
  Shift: { word: "shift", icon: "⇧" },
  Fn: { word: "fn", icon: "fn" },
};

export const formatSidedModifierIcon = (token: string): string | null => {
  const row = SIDED[token as SidedModifierToken];
  if (row === undefined) {
    return null;
  }
  return `${row.icon}(${row.side})`;
};

export const formatSidedModifierWord = (
  token: string,
  _lang: Lang,
): string | null => {
  const row = SIDED[token as SidedModifierToken];
  if (row === undefined) {
    return null;
  }
  return `${row.word}(${row.side})`;
};

export const formatGenericModifierIcon = (token: string): string | null => {
  const row = GENERIC[token];
  if (row === undefined) {
    return null;
  }
  return row.icon;
};

export const formatGenericModifierWord = (token: string): string | null => {
  const row = GENERIC[token];
  if (row === undefined) {
    return null;
  }
  return row.word;
};

export const catalogModifierLabel = (
  id: string,
  lang: Lang,
): string | null => {
  const map: Record<string, string> = {
    mod_left_command: "LeftMeta",
    mod_right_command: "RightMeta",
    mod_left_shift: "LeftShift",
    mod_right_shift: "RightShift",
    mod_left_option: "LeftOption",
    mod_right_option: "RightOption",
    mod_left_control: "LeftControl",
    mod_right_control: "RightControl",
    mod_fn: "Fn",
  };
  const token = map[id];
  if (token === undefined) {
    return null;
  }
  if (token === "Fn") {
    return "fn";
  }
  const sided = formatSidedModifierWord(token, lang);
  if (sided !== null) {
    return sided;
  }
  return formatGenericModifierWord(token);
};
