import type { EditorMode, HoldCapturePhase, Lang } from "@/types";

export const initialHoldCapture = () => ({
  listening: false,
  holdPhase: "idle" as HoldCapturePhase,
  pending: [] as string[],
  confirmed: [] as string[],
});

export const beginHoldCaptureListening = () => ({
  ...initialHoldCapture(),
  listening: true,
});

export const captureWaitingPressButton = (actionLabel: string, lang: Lang): string => {
  if (lang === "ko") {
    return `「${actionLabel}」 버튼을 눌러 주세요.`;
  }
  return `Press “${actionLabel}” to begin.`;
};

/** Exit capture session; keep modal open and prior confirmed value if any. */
export const stopHoldListening = (editor: EditorMode): EditorMode => {
  if (editor.kind === "custom_key") {
    const hasConfirmed = editor.confirmed.length > 0;
    return {
      ...editor,
      listening: false,
      pending: [],
      holdPhase: hasConfirmed ? "confirmed" : "idle",
    };
  }
  if (editor.kind === "custom_combo_activator") {
    const hasConfirmed = editor.confirmed.length > 0;
    return {
      ...editor,
      listening: false,
      pending: [],
      holdPhase: hasConfirmed ? "confirmed" : "idle",
      rejected: null,
    };
  }
  if (editor.kind === "button_mapping_activator") {
    return {
      ...editor,
      listening: false,
      rejected: null,
    };
  }
  return editor;
};

export type HoldCapturePreview =
  | { kind: "text"; text: string }
  | { kind: "tokens"; keys: string[]; statusText?: string };

export const holdCapturePreviewContent = (
  labels: {
    listeningWaiting: string;
    inProgressTag: string;
    waitingStart: string;
  },
  state: {
    listening: boolean;
    holdPhase: HoldCapturePhase;
    pending: string[];
    confirmed: string[];
  },
): HoldCapturePreview => {
  if (state.holdPhase === "confirmed" && state.confirmed.length > 0) {
    return { kind: "tokens", keys: state.confirmed };
  }
  if (state.listening) {
    if (state.pending.length > 0) {
      return {
        kind: "tokens",
        keys: state.pending,
        statusText: labels.inProgressTag,
      };
    }
    return {
      kind: "text",
      text: labels.listeningWaiting,
    };
  }
  return { kind: "text", text: labels.waitingStart };
};
