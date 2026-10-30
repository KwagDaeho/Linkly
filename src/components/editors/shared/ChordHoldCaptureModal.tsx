import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef } from "react";

import {
  Button,
  ChordError,
  ChordPreview,
  Modal,
  ModalFooter,
  Muted,
  Row,
} from "@/components/ui";
import * as styles from "./ChordHoldCaptureModal.css";

interface ChordHoldCaptureModalProps {
  title: ReactNode;
  hint: string;
  preview: ReactNode;
  error?: ReactNode;
  cancelLabel: string;
  saveLabel: string;
  startInputLabel: string;
  retryLabel: string;
  listening: boolean;
  canSave: boolean;
  onCancel: () => void;
  onStartInput: () => void;
  onRetry: () => void;
  onStopListening: () => void;
  onSave: () => void;
}

export const ChordHoldCaptureModal = (props: ChordHoldCaptureModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const showStart = !props.listening && !props.canSave;
  const showRetry = props.canSave;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (props.listening) {
      props.onStopListening();
      return;
    }
    props.onCancel();
  };

  return (
    <Modal ref={dialogRef} tabIndex={-1} onKeyDown={handleKeyDown}>
      <h2>{props.title}</h2>
      <Muted variant="modal">{props.hint}</Muted>
      <ChordPreview variant="field">{props.preview}</ChordPreview>
      {props.error ? <ChordError>{props.error}</ChordError> : null}
      <Row className={styles.actionRow}>
        {showRetry ? (
          <Button variant="ghost" onClick={props.onRetry}>
            {props.retryLabel}
          </Button>
        ) : null}
        {showStart ? (
          <Button onClick={props.onStartInput}>{props.startInputLabel}</Button>
        ) : null}
      </Row>
      <ModalFooter>
        <Button variant="ghost" onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
        <Button
          className={props.canSave ? undefined : styles.savePlaceholder}
          disabled={!props.canSave}
          tabIndex={props.canSave ? 0 : -1}
          aria-hidden={!props.canSave}
          onClick={props.onSave}
        >
          {props.saveLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
