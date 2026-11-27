import type { ReactNode } from "react";

import { cx } from "@/utils/cx";
import type { ToggleVariant } from "@/types";

import * as styles from "./Toggle.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
  variant?: ToggleVariant;
}

export const Toggle = (props: ToggleProps) => {
  const disabled = props.disabled === true;
  const variant = props.variant !== undefined ? props.variant : "default";
  const className = cx(
    styles.root,
    variant === "flag" && styles.flag,
    variant === "labelFirst" && styles.labelFirst,
  );
  const labelText = props.children ? (
    <span
      className={cx(
        styles.title,
        variant === "labelFirst" && styles.labelFirstTitle,
      )}
    >
      {props.children}
    </span>
  ) : null;

  return (
    <label className={className} title={props.title}>
      {variant === "labelFirst" ? (
        <>
          {labelText}
          <input
            type="checkbox"
            checked={props.checked}
            disabled={disabled}
            onChange={(event) => props.onChange(event.target.checked)}
          />
        </>
      ) : (
        <>
          <input
            type="checkbox"
            checked={props.checked}
            disabled={disabled}
            onChange={(event) => props.onChange(event.target.checked)}
          />
          {props.children}
        </>
      )}
    </label>
  );
};
