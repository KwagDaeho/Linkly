import type { ReactNode } from "react";

import { SectionHeading } from "./SectionHeading";
import * as styles from "./sectionTitle.css";

/** Non-accordion section (System tab): h2 + indented body. */
export const StaticSection = ({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) => (
  <section className={styles.staticSection}>
    <SectionHeading>{title}</SectionHeading>
    <div className={styles.staticSectionBody}>{children}</div>
  </section>
);
