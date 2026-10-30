import { CHORD_MODIFIERS } from "@/domain/profile";
import type {
  ActivatorCapturePayload,
  ActivatorCaptureResult,
  EditorMode,
  KeyCapturePayload,
} from "@/types";
export const applyKeyCapture = (
  editor: EditorMode,
  captureMode: "custom_key" | "macro" | "combo_capture",
  payload: KeyCapturePayload,
): EditorMode | null => {
  const { keys, escape } = payload;
  if (captureMode === "macro" && editor.kind === "macro" && editor.keyPrompt) {
    if (escape) return { ...editor, keyPrompt: null };
    const hasMain = keys.some((k) => !CHORD_MODIFIERS.has(k));
    if (!hasMain) return editor;
    const step = { type: "key_stroke" as const, keys };
    if (editor.keyPrompt.mode === "add") {
      return {
        ...editor,
        keyPrompt: null,
        steps: [...editor.steps, step],
      };
    }
    const nextSteps = editor.steps.slice();
    nextSteps[editor.keyPrompt.index] = step;
    return {
      ...editor,
      keyPrompt: null,
      steps: nextSteps,
    };
  }
  return editor;
};
export const resolveActivatorCapture = (
  editor: EditorMode,
  payload: ActivatorCapturePayload,
): ActivatorCaptureResult | null => {
  if (editor.kind === "button_mapping_activator") {
    if (!editor.listening) {
      return null;
    }
    const { escape, rejected, activator } = payload;
    if (escape) {
      return { kind: "close" };
    }
    if (rejected !== null) return { kind: "reject", rejected };
    if (activator !== null) {
      return {
        kind: "assign_button_mapping",
        entryId: editor.entryId,
        activator,
      };
    }
    return null;
  }
  if (editor.kind !== "ball_scroll_activator") return null;
  const { escape, rejected, activator } = payload;
  if (escape) return { kind: "close" };
  if (rejected !== null) return { kind: "reject", rejected };
  if (activator !== null)
    return { kind: "assign", slot: editor.slot, activator };
  return null;
};
