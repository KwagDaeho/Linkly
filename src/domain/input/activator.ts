/**
 * Universal input identity (SSOT on the FE). Anything the user can capture —
 * key, mouse button N, trackball HID button, etc. — maps to `Activator`.
 */
import {
  mouseButtonEventNumber,
  normalizeActivator,
} from "@/domain/profile/mouseButton";
import type { Activator, ComboActivator } from "@/types";

export const comboEffectiveTrigger = (
  combo: ComboActivator,
): Activator | null => {
  if (combo.trigger !== undefined && combo.trigger !== null) {
    return normalizeActivator(combo.trigger);
  }
  if (combo.button !== undefined && combo.button !== null) {
    return { type: "device", button: combo.button };
  }
  return null;
};

export const comboWithTrigger = (
  modifiers: string[],
  keys: string[],
  trigger: Activator,
): ComboActivator => ({
  modifiers,
  keys,
  trigger: normalizeActivator(trigger),
});



export const activatorsEqual = (
  left: Activator | null,
  right: Activator | null,
): boolean => {
  if (left === null || right === null) {
    return left === right;
  }
  const a = normalizeActivator(left);
  const b = normalizeActivator(right);
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === "key" && b.type === "key") {
    return a.name === b.name;
  }
  if (a.type === "mouse" && b.type === "mouse") {
    return (
      mouseButtonEventNumber(a.button) === mouseButtonEventNumber(b.button)
    );
  }
  if (a.type === "device" && b.type === "device") {
    return a.button === b.button;
  }
  return false;
};
