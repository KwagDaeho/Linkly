import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as reorder from "./reorder.css";

interface DragHandleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> {
  /** Accessible name + tooltip. */
  label: string;
  /** Extra content after the dots (e.g. a step number). */
  children?: ReactNode;
}

/** ⋮⋮ grip for drag-to-reorder rows; spread `useDragReorder().handleProps(i)` onto it. */
export const DragHandle = ({ label, className, children, ...rest }: DragHandleProps) => (
  <button
    type="button"
    className={cx(reorder.dragHandle, className)}
    aria-label={label}
    title={label}
    {...rest}
  >
    <span className={reorder.dragDots} aria-hidden>
      ⋮⋮
    </span>
    {children}
  </button>
);
