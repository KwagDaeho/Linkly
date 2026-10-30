import { comboActivatorToSnapshot } from "@/domain/capture";
import { initialHoldCapture } from "@/domain/capture/holdCapture";
import { comboIsValid } from "@/domain/profile";
import type {
  ButtonMappingEntry,
  ComboEditorState,
  CustomMappingEntry,
  EditorMode,
} from "@/types";

export const comboEditorStateFromEntry = (
  entry: CustomMappingEntry,
): ComboEditorState => {
  const valid = comboIsValid(entry.activator);
  const base = initialHoldCapture();
  if (!valid) {
    return {
      kind: "custom_combo_activator",
      entryId: entry.id,
      rejected: null,
      ...base,
    };
  }
  const confirmed = comboActivatorToSnapshot(entry.activator);
  return {
    kind: "custom_combo_activator",
    entryId: entry.id,
    rejected: null,
    listening: false,
    holdPhase: "confirmed",
    pending: [],
    confirmed,
  };
};

export const buttonMappingActivatorEditor = (
  entryId: string,
): Extract<EditorMode, { kind: "button_mapping_activator" }> => ({
  kind: "button_mapping_activator",
  entryId,
  rejected: null,
  listening: true,
});

export const buttonMappingActivatorEditorFromEntry = (
  entry: ButtonMappingEntry,
): Extract<EditorMode, { kind: "button_mapping_activator" }> =>
  buttonMappingActivatorEditor(entry.id);
