import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import { SectionHeading } from "./SectionHeading";
import * as styles from "./sectionTitle.css";

/** Link tab h2 group (Common, Trackball) — same typography as Info h2. */
export const SectionGroupHeading = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <SectionHeading
    alignWithAccordion
    className={cx(styles.sectionGroupTitle, className)}
  >
    {children}
  </SectionHeading>
);
