import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./ChordPreview.css";

export const ChordPreview = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <div className={cx(styles.field, className)}>{children}</div>;

export const ChordError = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <p className={cx(styles.error, className)}>{children}</p>;
