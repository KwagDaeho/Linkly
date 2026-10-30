import { comboActivatorToSnapshot } from "@/domain/capture";
import { beginHoldCaptureListening } from "@/domain/capture/holdCapture";
import { comboIsValid, newCustomMappingEntry } from "@/domain/profile";
import { newButtonMappingEntry } from "@/domain/profile/button";
import type {
  ButtonMappingEntry,
  ComboEditorState,
  CustomMappingEntry,
  EditorMode,
} from "@/types";

export const comboDraftEditorFromNewEntry = (): ComboEditorState => {
  const draftEntry = newCustomMappingEntry();
  return {
    kind: "custom_combo_activator",
    entryId: draftEntry.id,
    draftEntry,
    rejected: null,
    ...beginHoldCaptureListening(),
  };
};

export const comboEditorStateFromEntry = (
  entry: CustomMappingEntry,
): ComboEditorState => {
  const valid = comboIsValid(entry.activator);
  if (!valid) {
    return {
      kind: "custom_combo_activator",
      entryId: entry.id,
      rejected: null,
      ...beginHoldCaptureListening(),
    };
  }
  const confirmed = comboActivatorToSnapshot(entry.activator);
  return {
    kind: "custom_combo_activator",
    entryId: entry.id,
    rejected: null,
    listening: true,
    holdPhase: "confirmed",
    pending: [],
    confirmed,
  };
};

export const buttonMappingDraftEditor = (): Extract<
  EditorMode,
  { kind: "button_mapping_activator" }
> => {
  const draftEntry = newButtonMappingEntry();
  return {
    kind: "button_mapping_activator",
    entryId: draftEntry.id,
    draftEntry,
    rejected: null,
    listening: true,
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
