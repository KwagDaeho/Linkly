import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./MappingGroup.css";

interface MappingGroupProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

export const MappingGroup = ({ title, children, className }: MappingGroupProps) => (
  <section className={cx(styles.root, className)} aria-label={typeof title === "string" ? title : undefined}>
    <h2 className={styles.title}>{title}</h2>
    <div className={styles.body}>{children}</div>
  </section>
);
