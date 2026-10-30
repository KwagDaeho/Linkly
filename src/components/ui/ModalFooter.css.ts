import { style } from "@vanilla-extract/css";

/** Cancel / save (or confirm) — bottom-right, consistent across modals. */
export const root = style({
  marginTop: 16,
  justifyContent: "flex-end",
});
