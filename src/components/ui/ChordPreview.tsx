import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./ChordPreview.css";

export type ChordPreviewVariant = "inline" | "field";

interface ChordPreviewProps {
  children: ReactNode;
  className?: string;
  variant?: ChordPreviewVariant;
}

export const ChordPreview = ({
  children,
  className,
  variant = "inline",
}: ChordPreviewProps) => (
  <div
    className={cx(
      variant === "field" ? styles.field : styles.inline,
      className,
    )}
  >
    {children}
  </div>
);

export const ChordError = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <p className={cx(styles.error, className)}>{children}</p>;
