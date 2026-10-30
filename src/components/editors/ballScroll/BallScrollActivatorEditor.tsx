import { activatorRejectedMessage } from "@/domain/editors";
import { usePrefs } from "@/hooks/prefs";
import { useEditor } from "@/hooks/editor";
import type { ActivatorEditorState } from "@/types";

import { ActivatorCaptureModal } from "../shared";

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
    <ActivatorCaptureModal
      title={
        <>
          {i18n.activatorTitle} · {slotLabel}
        </>
      }
      hint={hint}
      statusMessage={statusMessage}
      cancelLabel={i18n.cancel}
      onCancel={() => setEditor(null)}
    />
  );
};
