import { comboEffectiveTrigger } from "@/domain/input";
import { activatorToCaptureToken } from "@/domain/keys/mouseKeyToken";
import { CHORD_MODIFIERS } from "@/domain/profile";
import type { Activator, ComboActivator } from "@/types";

export const CAPTURE_HOLD_MS = 1000;

const MODIFIER_ORDER = ["Control", "Option", "Shift", "Meta"] as const;

const MOUSE_CAPTURE_TOKENS = new Set([
  "MouseLeft",
  "MouseRight",
  "MouseMiddle",
  "MouseBack",
  "MouseForward",
]);

const HUGE_CAPTURE_TOKENS: Record<string, Activator> = {
  Fn1: { type: "huge", button: "fn1" },
  Fn2: { type: "huge", button: "fn2" },
  Fn3: { type: "huge", button: "fn3" },
  L: { type: "huge", button: "left" },
  R: { type: "huge", button: "right" },
};

export const isCaptureMouseToken = (token: string): boolean => {
  return MOUSE_CAPTURE_TOKENS.has(token) || token.startsWith("Button");
};

export const normalizeCaptureSnapshot = (tokens: string[]): string[] => {
  const mods = MODIFIER_ORDER.filter((m) => tokens.includes(m));
  const modSet = new Set<string>(mods);
  const rest = tokens.filter((t) => !CHORD_MODIFIERS.has(t) && !modSet.has(t));
  const seen = new Set<string>();
  const orderedRest: string[] = [];
  for (const token of rest) {
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    orderedRest.push(token);
  }
  return [...mods, ...orderedRest];
};

export const mergeCaptureSnapshot = (incoming: string[]): string[] => {
  if (incoming.length === 0) {
    return [];
  }
  return normalizeCaptureSnapshot(incoming);
};

export const comboActivatorToSnapshot = (
  combo: ComboActivator,
): string[] => {
  const parts = [...combo.modifiers, ...combo.keys];
  const trigger = comboEffectiveTrigger(combo);
  if (trigger !== null) {
    const token = activatorToCaptureToken(trigger);
    if (token !== null && !parts.includes(token)) {
      parts.push(token);
    }
  }
  return normalizeCaptureSnapshot(parts);
};

export const snapshotToComboActivator = (
  tokens: string[],
): ComboActivator | null => {
  const normalized = normalizeCaptureSnapshot(tokens);
  if (normalized.length === 0) {
    return null;
  }
  const modifiers = MODIFIER_ORDER.filter((m) => normalized.includes(m));
  const nonMods = normalized.filter((t) => !CHORD_MODIFIERS.has(t));
  const mouseLike = nonMods.filter((t) => isCaptureMouseToken(t));
  const keyLike = nonMods.filter((t) => !isCaptureMouseToken(t));

  let trigger: Activator | null = null;
  let keys = keyLike;

  if (mouseLike.length > 0) {
    trigger = tokenToActivator(mouseLike[mouseLike.length - 1]!);
  } else if (keyLike.length > 0) {
    const last = keyLike[keyLike.length - 1]!;
    trigger = { type: "key", name: last };
    keys = keyLike.slice(0, -1);
  } else if (modifiers.length > 0) {
    return null;
  }

  if (trigger === null) {
    return null;
  }

  const combo: ComboActivator = {
    modifiers: [...modifiers],
    keys,
    trigger,
  };
  if (
    combo.modifiers.length === 0 &&
    combo.keys.length === 0 &&
    trigger.type === "key"
  ) {
    return null;
  }
  return combo;
};

export const tokenToActivator = (token: string): Activator | null => {
  if (HUGE_CAPTURE_TOKENS[token]) {
    return HUGE_CAPTURE_TOKENS[token]!;
  }
  if (token === "MouseLeft") {
    return { type: "mouse", button: "left" };
  }
  if (token === "MouseRight") {
    return { type: "mouse", button: "right" };
  }
  if (token === "MouseMiddle") {
    return { type: "mouse", button: "middle" };
  }
  if (token === "MouseBack") {
    return { type: "mouse", button: "back" };
  }
  if (token === "MouseForward") {
    return { type: "mouse", button: "forward" };
  }
  if (token.startsWith("Button")) {
    const n = Number.parseInt(token.slice("Button".length), 10);
    if (!Number.isNaN(n)) {
      return { type: "mouse", button: { type: "other", number: n } };
    }
  }
  if (CHORD_MODIFIERS.has(token)) {
    return { type: "key", name: token };
  }
  return { type: "key", name: token };
};

export const snapshotIsValidCombo = (tokens: string[]): boolean => {
  const combo = snapshotToComboActivator(tokens);
  if (combo === null) {
    return false;
  }
  return (
    (combo.modifiers.length > 0 || combo.keys.length > 0) &&
    comboEffectiveTrigger(combo) !== null
  );
};

export const snapshotIsValidCustomKey = (tokens: string[]): boolean => {
  const normalized = normalizeCaptureSnapshot(tokens);
  return normalized.some((t) => !CHORD_MODIFIERS.has(t));
};
