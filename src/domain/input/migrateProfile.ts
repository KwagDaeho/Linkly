import { migrateLegacyButtonMappings } from "@/domain/profile/button";
import { comboEffectiveTrigger, comboWithTrigger } from "./activator";
import type { ComboActivator, Profile } from "@/types";

const normalizeCombo = (combo: ComboActivator): ComboActivator => {
  const trigger = comboEffectiveTrigger(combo);
  if (trigger === null) {
    return combo;
  }
  return comboWithTrigger(combo.modifiers, combo.keys, trigger);
};

type StoredProfile = Profile & { gestureMappings?: unknown };

/** Normalize legacy combo rows and drop removed product features. */
export const migrateProfileInputs = (profile: Profile): Profile => {
  const { gestureMappings: _removed, ...base } = profile as StoredProfile;
  let next: Profile = migrateLegacyButtonMappings(base);
  if (next.customMappings === undefined) {
    return next;
  }
  const customMappings = next.customMappings.map((entry) => ({
    ...entry,
    activator: normalizeCombo(entry.activator),
  }));
  return { ...next, customMappings };
};
