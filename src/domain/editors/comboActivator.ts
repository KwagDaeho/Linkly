import { comboEffectiveTrigger } from "@/domain/input";
import { comboIsValid } from "@/domain/profile";
import type { ComboEditorState, CustomMappingEntry } from "@/types";

export const comboEditorStateFromEntry = (
  entry: CustomMappingEntry,
): ComboEditorState => {
  const trigger = comboEffectiveTrigger(entry.activator);
  const valid = comboIsValid(entry.activator);
  return {
    kind: "custom_combo_activator",
    entryId: entry.id,
    phase: "capture",
    draftChord: [...entry.activator.modifiers, ...entry.activator.keys],
    draftTrigger: valid ? trigger : null,
    rejected: null,
  };
};
