import { useId, useState, type ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Accordion.css";

interface AccordionProps {
  title: ReactNode;
  summary?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export const Accordion = ({
  title,
  summary,
  defaultOpen = true,
  children,
  className,
}: AccordionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();

  return (
    <section className={cx(styles.root, className)}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <div className={styles.shell}>
        <button
          id={buttonId}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.chevron} data-open={open ? "" : undefined} aria-hidden>
            ›
          </span>
          <span className={styles.triggerText}>
            {summary ?? title}
          </span>
        </button>
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className={styles.panel}
          data-open={open ? "" : undefined}
        >
          {children}
        </div>
      </div>
    </section>
  );
};
