import { buildComboErrorMessage } from "@/i18n";
import {
  beginHoldCaptureListening,
  captureWaitingPressButton,
  snapshotToComboActivator,
  stopHoldListening,
} from "@/domain/capture";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useEditor } from "@/hooks/editor";
import type { ComboEditorState } from "@/types";

import { ChordHoldCaptureModal } from "../shared/ChordHoldCaptureModal";
import { HoldCapturePreviewView } from "../shared/HoldCapturePreview";

interface ComboActivatorEditorProps {
  editor: ComboEditorState;
}

export const ComboActivatorEditor = (props: ComboActivatorEditorProps) => {
  const { lang, i18n } = usePrefs();
  const { customMappings } = useProfileCtx();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const startLabel = i18n.captureStartTrigger;
  const canSave =
    editor.holdPhase === "confirmed" &&
    snapshotToComboActivator(editor.confirmed) !== null;
  const error = buildComboErrorMessage(editor.rejected, {
    incomplete: i18n.customMappingTriggerIncomplete,
    tilt: i18n.activatorRejectedTilt,
  });

  return (
    <ChordHoldCaptureModal
      title={i18n.customMappingTriggerTitle}
      hint={i18n.customMappingTriggerCaptureHint}
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
      error={error}
      cancelLabel={i18n.cancel}
      saveLabel={i18n.save}
      startInputLabel={startLabel}
      retryLabel={i18n.captureRetryInput}
      listening={editor.listening}
      canSave={canSave}
      onCancel={() => setEditor(null)}
      onStartInput={() =>
        setEditor({
          ...editor,
          ...beginHoldCaptureListening(),
          rejected: null,
        })
      }
      onRetry={() =>
        setEditor({
          ...editor,
          ...beginHoldCaptureListening(),
          rejected: null,
        })
      }
      onStopListening={() =>
        setEditor((previous) =>
          previous?.kind === "custom_combo_activator"
            ? stopHoldListening(previous)
            : previous,
        )
      }
      onSave={() => {
        const combo = snapshotToComboActivator(editor.confirmed);
        if (combo === null) {
          return;
        }
        customMappings.updateActivator(editor.entryId, combo);
        setEditor(null);
      }}
    />
  );
};
