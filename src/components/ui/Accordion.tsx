import { useId, useState, type ReactNode } from "react";

import {
  readAccordionOpen,
  writeAccordionOpen,
} from "@/services/accordionState";
import { cx } from "@/utils/cx";

import * as styles from "./Accordion.css";

interface AccordionProps {
  label: ReactNode;
  status?: ReactNode;
  statusOn?: boolean;
  /** 2 = Info 입력 디바이스 등. 3 = Link 매핑 아코디언 (default). */
  headingLevel?: 2 | 3;
  defaultOpen?: boolean;
  stateKey?: string;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
  className?: string;
}

export const Accordion = ({
  label,
  status,
  statusOn = false,
  headingLevel = 3,
  defaultOpen = true,
  stateKey,
  onOpenChange,
  children,
  className,
}: AccordionProps) => {
  const [open, setOpen] = useState(() =>
    stateKey !== undefined
      ? readAccordionOpen(stateKey, defaultOpen)
      : defaultOpen,
  );
  const setOpenState = (next: boolean) => {
    setOpen(next);
    if (stateKey !== undefined) {
      writeAccordionOpen(stateKey, next);
    }
    onOpenChange?.(next);
  };
  const panelId = useId();
  const headingId = useId();
  const HeadingTag = headingLevel === 2 ? "h2" : "h3";
  const headingTextClass =
    headingLevel === 2 ? styles.headingTextH2 : styles.headingTextH3;

  return (
    <section
      className={cx(styles.root, className)}
      data-heading-level={headingLevel}
    >
      <HeadingTag id={headingId} className={styles.heading}>
        <button
          type="button"
          className={styles.headingToggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenState(!open)}
        >
          <span
            className={styles.chevron}
            data-open={open ? "" : undefined}
            aria-hidden
          >
            ›
          </span>
          <span className={headingTextClass}>{label}</span>
          {status !== undefined && status !== null && status !== "" ? (
            <span className={styles.status} data-on={statusOn ? "" : undefined}>
              {status}
            </span>
          ) : null}
        </button>
      </HeadingTag>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        className={styles.panel}
        data-open={open ? "" : undefined}
        aria-hidden={!open}
      >
        <div className={styles.panelInner}>{children}</div>
      </div>
    </section>
  );
};
