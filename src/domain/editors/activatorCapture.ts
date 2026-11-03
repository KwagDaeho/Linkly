import type { ActivatorEditorState } from "@/types";

export const ACTIVATOR_REJECT_DUPLICATE = "duplicate" as const;

export const activatorRejectedMessage = (
  rejected: ActivatorEditorState["rejected"],
  labels: {
    left: string;
    tilt: string;
    ball_scroll?: string;
    duplicate?: string;
  },
): string | null => {
  if (rejected === ACTIVATOR_REJECT_DUPLICATE && labels.duplicate) {
    return labels.duplicate;
  }
  if (rejected === "left") {
    return labels.left;
  }
  if (rejected === "tilt") {
    return labels.tilt;
  }
  if (rejected === "ball_scroll" && labels.ball_scroll) {
    return labels.ball_scroll;
  }
  return null;
};
