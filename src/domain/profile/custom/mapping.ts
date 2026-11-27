import { comboEffectiveTrigger } from "@/domain/input";
import { DEFAULT_BINDING } from "../binding";
import type { ComboActivator, CustomMappingEntry, Profile } from "@/types";

export const customMappingsOf = (profile: Profile): CustomMappingEntry[] => {
  if (profile.customMappings === undefined) {
    return [];
  }
  return profile.customMappings;
};


export const newCustomMappingEntry = (): CustomMappingEntry => {
  return {
    id: crypto.randomUUID(),
    activator: { modifiers: [], keys: [] },
    ...DEFAULT_BINDING,
  };
};

export const comboIsValid = (activator: ComboActivator): boolean => {
  return (
    (activator.modifiers.length > 0 || activator.keys.length > 0) &&
    comboEffectiveTrigger(activator) !== null
  );
};
