import { activatorRejectedMessage } from "@/domain/editors";
import { usePrefs } from "@/hooks/prefs";
import { useEditor } from "@/hooks/editor";
import type { ActivatorEditorState } from "@/types";

import { CapturePromptModal } from "../shared";

interface BallScrollActivatorEditorProps {
  editor: ActivatorEditorState;
}

export const BallScrollActivatorEditor = (props: BallScrollActivatorEditorProps) => {
  const { i18n } = usePrefs();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const rejectedMessage = activatorRejectedMessage(editor.rejected, {
    left: i18n.activatorRejectedLeft,
    tilt: i18n.activatorRejectedTilt,
    duplicate: i18n.buttonMappingAlreadyRegistered,
  });
  const slotLabel =
    editor.slot === "toggle" ? i18n.ballScrollToggle : i18n.ballScrollHold;
  const hint =
    editor.slot === "toggle"
      ? i18n.ballScrollActivatorHintToggle
      : i18n.ballScrollActivatorHintHold;
  const statusMessage =
    rejectedMessage !== null ? rejectedMessage : i18n.activatorWaiting;

  return (
    <CapturePromptModal
      title={
        <>
          {editor.target === "gesture" ? i18n.gesture : i18n.activatorTitle} ·{" "}
          {slotLabel}
        </>
      }
      hint={hint}
      status={statusMessage}
      cancelLabel={i18n.cancel}
      onCancel={() => setEditor(null)}
      closeOnEscape
    />
  );
};
