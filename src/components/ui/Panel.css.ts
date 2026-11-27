import { globalStyle, style } from "@vanilla-extract/css";

import { panelPaddingX } from "./panelLayout";

export const root = style({
  background: "var(--panel)",
  border: "1px solid var(--line-accent)",
  borderRadius: "var(--radius)",
  padding: `10px ${panelPaddingX}px`,
  backdropFilter: "blur(10px)",
});

/** Accordion body — no outer box; layout rail lives on `Accordion` panelInner. */
export const plain = style({
  margin: 0,
  padding: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  backdropFilter: "none",
});

globalStyle(`${root} h2`, {
  margin: "0 0 2px",
  fontSize: "1rem",
});
