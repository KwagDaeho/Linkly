import type { ComboEditorState } from "@/types";


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
