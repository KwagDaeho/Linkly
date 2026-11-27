import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Row.css";

interface RowProps {
  children: ReactNode;
  className?: string;
}

export const Row = ({ children, className }: RowProps) => (
  <div className={cx(styles.root, className)}>{children}</div>
);
