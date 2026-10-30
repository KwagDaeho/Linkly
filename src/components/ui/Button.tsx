import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cx } from "@/utils/cx";
import type { ButtonSize, ButtonVariant } from "@/types";

import * as styles from "./Button.css";

interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "type" | "onClick" | "children"
  > {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const variant = props.variant !== undefined ? props.variant : "default";
  const size = props.size !== undefined ? props.size : "default";
  const { children, variant: _variant, size: _size, onClick, className, ...rest } =
    props;
  const mergedClassName = cx(
    variant === "ghost" && styles.ghost,
    variant === "remove" && styles.remove,
    size === "tiny" && styles.tiny,
    className,
  );
  return (
    <button
      ref={ref}
      type="button"
      className={mergedClassName || undefined}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
});
Button.displayName = "Button";
