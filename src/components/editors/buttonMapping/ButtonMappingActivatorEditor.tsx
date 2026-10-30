import { activatorRejectedMessage } from "@/domain/editors";
import { usePrefs } from "@/hooks/prefs";
import { useEditor } from "@/hooks/editor";

import { MacroKeyPrompt } from "../macro/MacroKeyPrompt";
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
  });
  const waitingLabel =
    rejectedMessage !== null
      ? rejectedMessage
      : i18n.captureInputWaiting;

  return (
    <MacroKeyPrompt
      title={i18n.buttonMappingTriggerModalTitle}
      hint={i18n.macroKeystrokeHint}
      waitingLabel={waitingLabel}
      cancelLabel={i18n.cancel}
      onCancel={() => setEditor(null)}
    />
  );
};
