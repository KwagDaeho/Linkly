import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./SectionHeading.css";
import * as sectionStyles from "./sectionTitle.css";

export const SectionHeading = ({
  children,
  className,
  /** Match accordion title row (spacer, no chevron) and panel indent. */
  alignWithAccordion = false,
}: {
  children: ReactNode;
  className?: string;
  alignWithAccordion?: boolean;
}) => {
  if (alignWithAccordion) {
    return (
      <h2 className={cx(sectionStyles.headingShell, className)}>
        <div className={sectionStyles.headingRow}>
          <span className={sectionStyles.headingLead} aria-hidden />
          <span className={sectionStyles.headingH2}>{children}</span>
        </div>
      </h2>
    );
  }
  return <h2 className={cx(styles.root, className)}>{children}</h2>;
};
