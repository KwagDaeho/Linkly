import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as styles from "./Panel.css";

interface PanelProps {
  children: ReactNode;
  variant?: "default" | "plain";
  className?: string;
}

export const Panel = ({ children, variant = "default", className }: PanelProps) => (
  <section
    className={cx(variant === "plain" ? styles.plain : styles.root, className)}
  >
    {children}
  </section>
);
