import type { MacroStep } from "@/types";

const DEFAULT_MACRO_DELAY_MS = 100;

const clampMacroDelayMs = (value: number): number => {
  return Math.max(0, Math.min(5000, value));
};

/** Delay prompt input → stored ms (non-numbers become 0). */
export const parseMacroDelayMs = (text: string): number =>
  clampMacroDelayMs(Number(text) || 0);

/** Initial value for the delay prompt: the step's ms when editing a delay. */
export const macroDelayAt = (steps: MacroStep[], index: number | null): number => {
  const step = index === null ? undefined : steps[index];
  return step?.type === "delay" ? step.ms : DEFAULT_MACRO_DELAY_MS;
};

/** Appends a delay step (`index` null) or replaces step `index` with one. */
export const withMacroDelay = (
  steps: MacroStep[],
  index: number | null,
  ms: number,
): MacroStep[] => {
  const step: MacroStep = { type: "delay", ms };
  if (index === null) {
    return [...steps, step];
  }
  const next = steps.slice();
  next[index] = step;
  return next;
};

export const isEditableStep = (step: MacroStep): boolean =>
  step.type === "delay" || step.type === "key_stroke";
