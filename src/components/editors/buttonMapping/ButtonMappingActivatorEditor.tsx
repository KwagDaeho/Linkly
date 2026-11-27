import { activatorRejectedMessage } from "@/domain/editors";
import { usePrefs } from "@/hooks/prefs";
import { useEditor } from "@/hooks/editor";

import { CapturePromptModal } from "../shared";
import type { EditorMode } from "@/types";

type ButtonMappingActivatorEditorState = Extract<
  EditorMode,
  { kind: "button_mapping_activator" }
>;

interface ButtonMappingActivatorEditorProps {
  editor: ButtonMappingActivatorEditorState;
}

export const ButtonMappingActivatorEditor = (
  props: ButtonMappingActivatorEditorProps,
) => {
  const { i18n } = usePrefs();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const rejectedMessage = activatorRejectedMessage(editor.rejected, {
    left: i18n.activatorRejectedLeft,
    tilt: i18n.activatorRejectedTilt,
    duplicate: i18n.buttonMappingAlreadyRegistered,
  });
  const waitingLabel =
    rejectedMessage !== null
      ? rejectedMessage
      : i18n.captureInputWaiting;

  return (
    <CapturePromptModal
      title={i18n.buttonMappingTriggerModalTitle}
      hint={i18n.macroKeystrokeHint}
      status={waitingLabel}
      cancelLabel={i18n.cancel}
      onCancel={() => setEditor(null)}
      nested
      closeOnBackdrop
      closeOnEscape
    />
  );
};
