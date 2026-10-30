import type { ElementType, ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Panel.css";

type PanelVariant =
  | "default"
  | "plain"
  | "row"
  | "rowSplit"
  | "warn"
  | "warnPlain";

interface PanelProps {
  as?: ElementType;
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
}

export const Panel = ({
  as: Tag = "section",
  children,
  variant = "default",
  className,
}: PanelProps) => {
  const variantClass =
    variant === "plain"
      ? styles.plain
      : variant === "row"
        ? styles.row
        : variant === "rowSplit"
          ? cx(styles.row, styles.rowSplit)
          : variant === "warn"
            ? styles.warn
            : variant === "warnPlain"
              ? styles.warnPlain
              : styles.root;

  return <Tag className={cx(variantClass, className)}>{children}</Tag>;
};

export { styles as panelStyles };
