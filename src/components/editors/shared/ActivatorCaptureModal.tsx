import type { ReactNode } from "react";

import {
  Button,
  ChordPreview,
  Modal,
  ModalFooter,
  Muted,
} from "@/components/ui";

interface ActivatorCaptureModalProps {
  title: ReactNode;
  hint: string;
  statusMessage: string;
  cancelLabel: string;
  onCancel: () => void;
}

export const ActivatorCaptureModal = (props: ActivatorCaptureModalProps) => {
  return (
    <Modal onEscape={props.onCancel}>
      <h2>{props.title}</h2>
      <Muted variant="modal">{props.hint}</Muted>
      <ChordPreview variant="field">{props.statusMessage}</ChordPreview>
      <ModalFooter>
        <Button variant="ghost" data-capture-cancel onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
