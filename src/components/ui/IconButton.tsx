import { forwardRef, type ButtonHTMLAttributes } from "react";

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "aria-label" | "title"> {
  /** Accessible name + tooltip (the visible content is an icon / glyph). */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, ...rest }, ref) => (
    <button ref={ref} type="button" aria-label={label} title={label} {...rest} />
  ),
);
IconButton.displayName = "IconButton";
