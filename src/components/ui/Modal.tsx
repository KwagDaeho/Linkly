import {
  forwardRef,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Modal.css";

interface ModalProps {
  children: ReactNode;
  wide?: boolean;
  compact?: boolean;
  plainBackdrop?: boolean;
  nested?: boolean;
  className?: string;
  tabIndex?: number;
  onBackdropClick?: () => void;
  /** Closes on Esc; dialog is focused on mount when set. */
  onEscape?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>((props, ref) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropClass = props.nested
    ? styles.nestedBackdrop
    : props.plainBackdrop
      ? styles.backdropPlain
      : styles.backdrop;

  useEffect(() => {
    if (props.onEscape === undefined) {
      return;
    }
    const node = dialogRef.current;
    node?.focus();
  }, [props.onEscape]);

  const setDialogRef = (node: HTMLDivElement | null) => {
    dialogRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref !== null) {
      ref.current = node;
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && props.onEscape) {
      event.preventDefault();
      event.stopPropagation();
      props.onEscape();
    }
    props.onKeyDown?.(event);
  };

  const tabIndex =
    props.tabIndex ?? (props.onEscape !== undefined ? -1 : undefined);

  return (
    <div
      className={backdropClass}
      role="presentation"
      onClick={props.onBackdropClick}
    >
      <div
        ref={setDialogRef}
        className={cx(
          styles.dialog,
          props.wide && styles.dialogWide,
          props.compact && styles.dialogCompact,
          props.className,
        )}
        role="dialog"
        aria-modal="true"
        tabIndex={tabIndex}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {props.children}
      </div>
    </div>
  );
});
Modal.displayName = "Modal";
