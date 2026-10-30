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
      <h2 className={cx(sectionStyles.headingH2, className)}>{children}</h2>
    );
  }
  return <h2 className={cx(styles.root, className)}>{children}</h2>;
};
