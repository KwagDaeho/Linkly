import type { MacroStep } from "@/types";

export const isEditableStep = (step: MacroStep): boolean =>
  step.type === "delay" || step.type === "key_stroke";
