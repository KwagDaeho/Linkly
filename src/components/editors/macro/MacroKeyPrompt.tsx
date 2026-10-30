import {
  Button,
  ChordPreview,
  Modal,
  ModalFooter,
  Muted,
} from "@/components/ui";

interface MacroKeyPromptProps {
  title: string;
  hint: string;
  waitingLabel: string;
  cancelLabel: string;
  onCancel: () => void;
}

export const MacroKeyPrompt = (props: MacroKeyPromptProps) => {
  return (
    <Modal nested onBackdropClick={props.onCancel} onEscape={props.onCancel}>
      <h2 id="macro-key-prompt-title">{props.title}</h2>
      <Muted variant="modal">{props.hint}</Muted>
      <ChordPreview variant="field">{props.waitingLabel}</ChordPreview>
      <ModalFooter>
        <Button variant="ghost" data-capture-cancel onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
