import type { EditorMode, CaptureMode, CaptureSession } from "@/types";
import { CAPTURE_SESSION_OFF } from "@/services/tauri";
export const captureModeOf = (editor: EditorMode | null): CaptureMode => {
  if (!editor) return "off";
  if (editor.kind === "custom_key" && editor.listening) return "chord_hold";
  if (editor.kind === "custom_combo_activator" && editor.listening) {
    return "chord_hold";
  }
  if (editor.kind === "macro" && editor.keyPrompt) return "macro";
  if (editor.kind === "ball_scroll_activator") return "ball_scroll";
  if (editor.kind === "button_mapping_activator" && editor.listening) {
    return "button_mapping_capture";
  }
  return "off";
};
export const captureLeftClickEscape = (
  editor: EditorMode | null,
): boolean => {
  if (editor === null) {
    return false;
  }
  if (editor.kind === "custom_key" && editor.listening) {
    return true;
  }
  if (editor.kind === "custom_combo_activator" && editor.listening) {
    return true;
  }
  if (editor.kind === "button_mapping_activator") {
    return true;
  }
  if (editor.kind === "macro" && editor.keyPrompt) {
    return true;
  }
  return false;
};

export const captureSessionForEditor = (
  editor: EditorMode | null,
): CaptureSession => {
  const mode = captureModeOf(editor);
  const session = captureSessionFor(mode);
  return {
    ...session,
    leftClickEscape: captureLeftClickEscape(editor),
  };
};

export const captureSessionFor = (mode: CaptureMode): CaptureSession => {
  switch (mode) {
    case "chord_hold":
      return {
        keyCapture: false,
        comboTrigger: true,
        activatorCapture: true,
        allowLeftActivator: true,
        uiModal: true,
      };
    case "combo_capture":
      return {
        keyCapture: false,
        comboTrigger: true,
        activatorCapture: false,
        uiModal: true,
      };
    case "combo_trigger":
      return {
        keyCapture: false,
        comboTrigger: false,
        activatorCapture: true,
        allowLeftActivator: true,
        uiModal: true,
      };
    case "macro":
      return {
        keyCapture: true,
        comboTrigger: false,
        activatorCapture: false,
        uiModal: true,
      };
    case "ball_scroll":
      return {
        keyCapture: false,
        comboTrigger: false,
        activatorCapture: true,
        uiModal: true,
      };
    case "button_mapping_capture":
      return {
        keyCapture: false,
        comboTrigger: false,
        activatorCapture: true,
        allowLeftActivator: true,
        uiModal: true,
      };
    default:
      return CAPTURE_SESSION_OFF;
  }
};
