import type { ReactNode } from "react";

import { cx } from "@/utils/cx";

import { headingH2 } from "./sectionTitle.css";

export const SectionHeading = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => <h2 className={cx(headingH2, className)}>{children}</h2>;
