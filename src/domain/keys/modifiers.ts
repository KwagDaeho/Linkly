export const LEGACY_CHORD_MODIFIERS = ["Control", "Option", "Shift", "Meta"] as const;

export const SIDE_CHORD_MODIFIERS = [
  "LeftControl",
  "RightControl",
  "LeftOption",
  "RightOption",
  "LeftShift",
  "RightShift",
  "LeftMeta",
  "RightMeta",
] as const;

export const CHORD_MODIFIER_TOKENS = new Set<string>([
  ...LEGACY_CHORD_MODIFIERS,
  ...SIDE_CHORD_MODIFIERS,
]);

export const CHORD_MODIFIER_ORDER = [
  ...LEGACY_CHORD_MODIFIERS,
  ...SIDE_CHORD_MODIFIERS,
] as const;

export const isChordModifierToken = (token: string): boolean =>
  CHORD_MODIFIER_TOKENS.has(token);

const LEGACY_SIDE_PAIRS: Record<
  (typeof LEGACY_CHORD_MODIFIERS)[number],
  readonly [string, string]
> = {
  Control: ["LeftControl", "RightControl"],
  Option: ["LeftOption", "RightOption"],
  Shift: ["LeftShift", "RightShift"],
  Meta: ["LeftMeta", "RightMeta"],
};

/** Legacy aggregate (Meta) matches either side; side-specific names match exactly. */
export const keyModifierTokensMatch = (a: string, b: string): boolean => {
  if (a === b) {
    return true;
  }
  for (const [legacy, pair] of Object.entries(LEGACY_SIDE_PAIRS)) {
    const sides = pair as readonly [string, string];
    if (a === legacy && (b === sides[0] || b === sides[1])) {
      return true;
    }
    if (b === legacy && (a === sides[0] || a === sides[1])) {
      return true;
    }
  }
  return false;
};
