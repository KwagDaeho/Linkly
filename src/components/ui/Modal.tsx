import {
  forwardRef,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "@/utils/cx";

import { Muted } from "./Muted";
import * as styles from "./Modal.css";

interface ModalProps {
  children: ReactNode;
  /** Rendered as the dialog's `h2`. */
  title?: ReactNode;
  /** Muted helper text under the title. */
  hint?: ReactNode;
  /** Render into `document.body` (escapes transformed / clipped ancestors). */
  portal?: boolean;
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

  const modal = (
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
        {props.title !== undefined ? <h2>{props.title}</h2> : null}
        {props.hint !== undefined ? (
          <Muted variant="modal">{props.hint}</Muted>
        ) : null}
        {props.children}
      </div>
    </div>
  );
  return props.portal ? createPortal(modal, document.body) : modal;
});
Modal.displayName = "Modal";
