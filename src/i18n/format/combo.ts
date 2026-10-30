import { formatKeyChord } from "./keys";
import type { ComboEditorState, Lang } from "@/types";

export const buildComboPreview = (
  editor: ComboEditorState,
  lang: Lang,
  waitingLabel: string,
): string => {
  if (editor.holdPhase === "confirmed" && editor.confirmed.length > 0) {
    return formatKeyChord(editor.confirmed, lang);
  }
  if (editor.pending.length > 0) {
    return formatKeyChord(editor.pending, lang);
  }
  return waitingLabel;
};

export const buildComboErrorMessage = (
  rejected: ComboEditorState["rejected"],
  labels: {
    incomplete: string;
    tilt: string;
  },
): string | null => {
  if (rejected === "incomplete") {
    return labels.incomplete;
  }
  if (rejected === "tilt") {
    return labels.tilt;
  }
  return null;
};
