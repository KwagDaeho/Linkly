import { useState } from "react";

import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useEditor } from "@/hooks/editor";
import { Button, Modal, ModalActions, Row } from "@/components/ui";
import { CapturePromptModal } from "@/components/editors/shared";
import { macroDelayAt, withMacroDelay } from "@/domain/editors";
import type { MacroEditorState, MacroStep } from "@/types";

import { MacroDelayPrompt } from "./MacroDelayPrompt";
import { MacroStepList } from "./MacroStepList";

interface MacroEditorProps {
  editor: MacroEditorState;
}

type DelayPrompt =
  | { mode: "add" }
  | { mode: "edit"; index: number };

export const MacroEditor = (props: MacroEditorProps) => {
  const { lang, i18n } = usePrefs();
  const { mappings } = useProfileCtx();
  const { setEditor } = useEditor();
  const editor = props.editor;
  const [delayPrompt, setDelayPrompt] = useState<DelayPrompt | null>(null);

  const updateSteps = (steps: MacroStep[]) => {
    setEditor({ ...editor, steps });
  };

  const handleSave = () => {
    mappings.updateSlot(editor.target, editor.slot, {
      type: "macro",
      steps: editor.steps,
    });
    setEditor(null);
  };

  const openKeyPrompt = (mode: "add" | "edit", index?: number) => {
    setEditor({
      ...editor,
      keyPrompt:
        mode === "add" ? { mode: "add" } : { mode: "edit", index: index! },
    });
  };

  const handleEditStep = (index: number) => {
    const step = editor.steps[index];
    if (step?.type === "delay") {
      setDelayPrompt({ mode: "edit", index });
      return;
    }
    if (step?.type === "key_stroke") {
      openKeyPrompt("edit", index);
    }
  };

  const promptInitialMs = macroDelayAt(
    editor.steps,
    delayPrompt?.mode === "edit" ? delayPrompt.index : null,
  );

  return (
    <>
      <Modal
        wide
        title={i18n.macroTitle}
        hint={i18n.macroHint}
        onEscape={() => setEditor(null)}
      >
        <MacroStepList
          steps={editor.steps}
          lang={lang}
          editLabel={i18n.editStep}
          removeLabel={i18n.removeStep}
          reorderHint={i18n.macroReorderHint}
          onStepsChange={updateSteps}
          onEditStep={handleEditStep}
        />
        <Row>
          <Button variant="ghost" onClick={() => openKeyPrompt("add")}>
            {i18n.addMacroAction}
          </Button>
          <Button variant="ghost" onClick={() => setDelayPrompt({ mode: "add" })}>
            {i18n.addDelay}
          </Button>
        </Row>
        <ModalActions
          cancelLabel={i18n.cancel}
          onCancel={() => setEditor(null)}
          confirmLabel={i18n.save}
          onConfirm={handleSave}
          confirmDisabled={editor.steps.length === 0}
        />
      </Modal>
      {editor.keyPrompt ? (
        <CapturePromptModal
          title={
            editor.keyPrompt.mode === "add"
              ? i18n.addMacroAction
              : i18n.editKeystroke
          }
          hint={i18n.macroKeystrokeHint}
          status={i18n.captureInputWaiting}
          cancelLabel={i18n.cancel}
          onCancel={() => setEditor({ ...editor, keyPrompt: null })}
          nested
          closeOnBackdrop
          closeOnEscape
        />
      ) : null}
      {delayPrompt ? (
        <MacroDelayPrompt
          title={
            delayPrompt.mode === "add" ? i18n.addDelay : i18n.editDelay
          }
          delayLabel={i18n.delayMs}
          confirmLabel={i18n.save}
          cancelLabel={i18n.cancel}
          initialMs={promptInitialMs}
          onConfirm={(ms) => {
            updateSteps(
              withMacroDelay(
                editor.steps,
                delayPrompt.mode === "edit" ? delayPrompt.index : null,
                ms,
              ),
            );
            setDelayPrompt(null);
          }}
          onCancel={() => setDelayPrompt(null)}
        />
      ) : null}
    </>
  );
};
