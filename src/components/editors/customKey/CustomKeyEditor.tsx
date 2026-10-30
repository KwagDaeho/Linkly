import {
  beginHoldCaptureListening,
  captureWaitingPressButton,
  stopHoldListening,
} from "@/domain/capture";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useEditor } from "@/hooks/editor";
import type { CustomKeyEditorState } from "@/types";

import { ChordHoldCaptureModal } from "../shared/ChordHoldCaptureModal";
import { HoldCapturePreviewView } from "../shared/HoldCapturePreview";

interface CustomKeyEditorProps {
  editor: CustomKeyEditorState;
}

export const CustomKeyEditor = (props: CustomKeyEditorProps) => {
  const { lang, i18n } = usePrefs();
  const { mappings } = useProfileCtx();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const startLabel = i18n.captureStartInput;
  const canSave =
    editor.holdPhase === "confirmed" && editor.confirmed.length > 0;

  return (
    <ChordHoldCaptureModal
      title={i18n.customKeyTitle}
      hint={i18n.customKeyHint}
      preview={
        <HoldCapturePreviewView
          lang={lang}
          labels={{
            inProgressTag: i18n.captureInProgressTag,
            idlePrompt: i18n.captureHoldListening,
            waitingStart: captureWaitingPressButton(startLabel, lang),
          }}
          state={editor}
        />
      }
      cancelLabel={i18n.cancel}
      saveLabel={i18n.save}
      startInputLabel={startLabel}
      retryLabel={i18n.captureRetryInput}
      listening={editor.listening}
      canSave={canSave}
      onCancel={() => setEditor(null)}
      onStartInput={() =>
        setEditor({ ...editor, ...beginHoldCaptureListening() })
      }
      onRetry={() =>
        setEditor({ ...editor, ...beginHoldCaptureListening() })
      }
      onStopListening={() =>
        setEditor((previous) =>
          previous?.kind === "custom_key"
            ? stopHoldListening(previous)
            : previous,
        )
      }
      onSave={() => {
        mappings.updateSlot(editor.target, editor.slot, {
          type: "key_stroke",
          keys: editor.confirmed,
        });
        setEditor(null);
      }}
    />
  );
};
