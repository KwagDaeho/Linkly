/** Side suffix for L/R modifier keys — SSOT for UI, catalog, and viewer. */
type ModifierSideLetter = "L" | "R";

const GENERIC = {
  Meta: { word: "command", icon: "⌘" },
  Option: { word: "option", icon: "⌥" },
  Control: { word: "control", icon: "⌃" },
  Shift: { word: "shift", icon: "⇧" },
  Fn: { word: "fn", icon: "fn" },
} as const;

type GenericModifierToken = keyof typeof GENERIC;

const SIDED: Record<
  string,
  { base: Exclude<GenericModifierToken, "Fn">; side: ModifierSideLetter }
> = {
  LeftMeta: { base: "Meta", side: "L" },
  RightMeta: { base: "Meta", side: "R" },
  LeftOption: { base: "Option", side: "L" },
  RightOption: { base: "Option", side: "R" },
  LeftControl: { base: "Control", side: "L" },
  RightControl: { base: "Control", side: "R" },
  LeftShift: { base: "Shift", side: "L" },
  RightShift: { base: "Shift", side: "R" },
};

const sidedLabel = (token: string, field: "word" | "icon"): string | null => {
  const row = SIDED[token];
  return row === undefined ? null : `${GENERIC[row.base][field]}(${row.side})`;
};

const genericLabel = (token: string, field: "word" | "icon"): string | null =>
  (GENERIC as Record<string, { word: string; icon: string } | undefined>)[token]?.[
    field
  ] ?? null;

export const formatSidedModifierIcon = (token: string): string | null =>
  sidedLabel(token, "icon");

export const formatSidedModifierWord = (token: string): string | null =>
  sidedLabel(token, "word");

export const formatGenericModifierIcon = (token: string): string | null =>
  genericLabel(token, "icon");

export const formatGenericModifierWord = (token: string): string | null =>
  genericLabel(token, "word");

const CATALOG_MODIFIER_TOKENS: Record<string, string> = {
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

export const catalogModifierLabel = (id: string): string | null => {
  const token = CATALOG_MODIFIER_TOKENS[id];
  if (token === undefined) {
    return null;
  }
  return formatSidedModifierWord(token) ?? formatGenericModifierWord(token);
};
