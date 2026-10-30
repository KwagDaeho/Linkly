import { activatorRejectedMessage } from "@/domain/editors";
import { usePrefs } from "@/hooks/prefs";
import { useEditor } from "@/hooks/editor";
import type { EditorMode } from "@/types";

import { ActivatorCaptureModal } from "../shared";

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
  const statusMessage =
    rejectedMessage !== null ? rejectedMessage : i18n.activatorWaiting;

  return (
    <ActivatorCaptureModal
      title={i18n.buttonMappingSetInput}
      hint={i18n.activatorHint}
      statusMessage={statusMessage}
      cancelLabel={i18n.cancel}
      onCancel={() => setEditor(null)}
    />
  );
};
