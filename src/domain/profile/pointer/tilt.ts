import type {
  Action,
  Activator,
  ButtonBinding,
  ButtonId,
  ComboActivator,
  Profile,
} from "@/types";

import { asBinding } from "../binding";
import { buttonMappingsOf } from "../button";
import { customMappingsOf } from "../custom";

export const isTiltButton = (id: ButtonId): boolean => {
  return id === "wheel_tilt_left" || id === "wheel_tilt_right";
};

export const isTiltPanStreamAction = (action: Action): boolean => {
  if (action.type === "default") return true;
  return action.type === "scroll" && action.dy === 0 && action.dx !== 0;
};

export const tiltForcesAutoClick = (id: ButtonId, _click: Action): boolean => {
  return isTiltButton(id);
};

export const hugeButtonFromActivator = (
  activator: Activator | null | undefined,
): ButtonId | undefined => {
  if (activator?.type === "huge") {
    return activator.button;
  }
  return undefined;
};

export const hugeButtonFromComboTrigger = (
  combo: ComboActivator,
): ButtonId | undefined => {
  if (combo.trigger !== undefined) {
    return hugeButtonFromActivator(combo.trigger);
  }
  return combo.button;
};

export const enforceTiltBindingFlags = (
  binding: ButtonBinding,
): ButtonBinding => ({
  ...binding,
  autoClick: true,
  longPressEnabled: false,
});

export const normalizeTiltPanStreamFlags = (profile: Profile): Profile => {
  let next = profile;
  let changed = false;
  const buttons = { ...profile.buttons };
  for (const id of ["wheel_tilt_left", "wheel_tilt_right"] as ButtonId[]) {
    const current = asBinding(buttons[id]);
    if (current.autoClick && !current.longPressEnabled) continue;
    buttons[id] = enforceTiltBindingFlags(current);
    changed = true;
  }
  if (changed) {
    next = { ...next, buttons };
  }

  const buttonMappings = buttonMappingsOf(next);
  let mappingsChanged = false;
  const nextMappings = buttonMappings.map((entry) => {
    const id = hugeButtonFromActivator(entry.activator);
    if (id === undefined || !isTiltButton(id)) {
      return entry;
    }
    const binding = asBinding(entry);
    if (binding.autoClick && !binding.longPressEnabled) {
      return entry;
    }
    mappingsChanged = true;
    return { ...entry, ...enforceTiltBindingFlags(binding) };
  });

  const customs = customMappingsOf(next);
  let customsChanged = false;
  const nextCustoms = customs.map((entry) => {
    const id = hugeButtonFromComboTrigger(entry.activator);
    if (id === undefined || !isTiltButton(id)) {
      return entry;
    }
    const binding = asBinding(entry);
    if (binding.autoClick && !binding.longPressEnabled) {
      return entry;
    }
    customsChanged = true;
    return { ...entry, ...enforceTiltBindingFlags(binding) };
  });

  if (!mappingsChanged && !customsChanged) {
    return changed ? next : profile;
  }
  return {
    ...next,
    ...(mappingsChanged ? { buttonMappings: nextMappings } : {}),
    ...(customsChanged ? { customMappings: nextCustoms } : {}),
  };
};
