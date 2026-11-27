import type { ReactNode } from "react";

import { Button, ChordPreview, Modal, ModalFooter } from "@/components/ui";

interface CapturePromptModalProps {
  title: ReactNode;
  hint: ReactNode;
  /** Waiting / rejected message in the capture field. */
  status: ReactNode;
  cancelLabel: string;
  onCancel: () => void;
  nested?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  portal?: boolean;
}

/** "Press an input…" modal shown while the backend captures the next input. */
export const CapturePromptModal = (props: CapturePromptModalProps) => (
  <Modal
    title={props.title}
    hint={props.hint}
    nested={props.nested}
    portal={props.portal}
    onBackdropClick={props.closeOnBackdrop ? props.onCancel : undefined}
    onEscape={props.closeOnEscape ? props.onCancel : undefined}
  >
    <ChordPreview>{props.status}</ChordPreview>
    <ModalFooter>
      <Button variant="ghost" data-capture-cancel onClick={props.onCancel}>
        {props.cancelLabel}
      </Button>
    </ModalFooter>
  </Modal>
);
