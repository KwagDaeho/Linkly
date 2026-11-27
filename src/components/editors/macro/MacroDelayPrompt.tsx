import { useEffect, useRef, useState } from "react";

import { parseMacroDelayMs } from "@/domain/editors";
import { Modal, ModalActions } from "@/components/ui";

import * as styles from "./MacroDelayPrompt.css";

interface MacroDelayPromptProps {
  title: string;
  delayLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  initialMs: number;
  onConfirm: (ms: number) => void;
  onCancel: () => void;
}

export const MacroDelayPrompt = (props: MacroDelayPromptProps) => {
  const [ms, setMs] = useState(String(props.initialMs));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = () => {
    props.onConfirm(parseMacroDelayMs(ms));
  };

  return (
    <Modal
      nested
      compact
      title={props.title}
      onBackdropClick={props.onCancel}
      onEscape={props.onCancel}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        }
      }}
    >
      <label className={styles.delayField}>
        {props.delayLabel}
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={5000}
          inputMode="numeric"
          value={ms}
          onChange={(event) => setMs(event.target.value)}
        />
      </label>
      <ModalActions
        cancelLabel={props.cancelLabel}
        onCancel={props.onCancel}
        confirmLabel={props.confirmLabel}
        onConfirm={submit}
      />
    </Modal>
  );
};
