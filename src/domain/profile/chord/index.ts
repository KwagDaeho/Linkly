import {
  CHORD_MODIFIER_ORDER,
  CHORD_MODIFIER_TOKENS,
} from "@/domain/keys/modifiers";

export const CHORD_MODIFIERS = CHORD_MODIFIER_TOKENS;
const MODIFIER_ORDER = CHORD_MODIFIER_ORDER;

export const splitChord = (
  chord: string[],
): {
  modifiers: string[];
  keys: string[];
} => {
  const modifiers = MODIFIER_ORDER.filter((m) => chord.includes(m));
  const keys = chord.filter((k) => !CHORD_MODIFIERS.has(k));
  return { modifiers, keys };
};

export const chordIsValid = (chord: string[]): boolean => {
  return chord.length > 0;
};
