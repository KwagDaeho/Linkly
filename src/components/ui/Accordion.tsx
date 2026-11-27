import { useId, type ReactNode } from "react";

import { usePersistedOpen } from "@/hooks/usePersistedOpen";

import * as styles from "./Accordion.css";

interface AccordionProps {
  label: ReactNode;
  status?: ReactNode;
  statusOn?: boolean;
  defaultOpen?: boolean;
  stateKey: string;
  children: ReactNode;
}

export const Accordion = ({
  label,
  status,
  statusOn = false,
  defaultOpen = true,
  stateKey,
  children,
}: AccordionProps) => {
  const [open, setOpenState] = usePersistedOpen(stateKey, defaultOpen);
  const panelId = useId();
  const headingId = useId();

  return (
    <section className={styles.root} data-open={open ? "" : undefined}>
      <h3 id={headingId} className={styles.heading}>
        <button
          type="button"
          className={styles.headingToggle}
          data-own-hover="press"
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
          <span className={styles.headingTextH3}>{label}</span>
          {status !== undefined && status !== null && status !== "" ? (
            <span className={styles.status} data-on={statusOn ? "" : undefined}>
              {status}
            </span>
          ) : null}
        </button>
      </h3>
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
