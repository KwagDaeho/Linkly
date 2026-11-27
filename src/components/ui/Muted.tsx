import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Muted.css";

interface MutedProps {
  children: ReactNode;
  as?: "p" | "span" | "li";
  variant?: "default" | "modal" | "inList";
  className?: string;
}

export const Muted = ({
  children,
  as: Tag = "p",
  variant = "default",
  className,
}: MutedProps) => {
  const variantClass =
    variant === "modal"
      ? cx(styles.root, styles.inModal)
      : variant === "inList"
        ? cx(styles.root, styles.inList)
        : styles.root;

  return <Tag className={cx(variantClass, className)}>{children}</Tag>;
};
