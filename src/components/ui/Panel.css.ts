import { globalStyle, style } from "@vanilla-extract/css";

import { panelPaddingX } from "./panelLayout";
import { root as toggleRoot } from "./Toggle.css";

export const heading = style({
  margin: "0 0 2px",
  fontSize: "1rem",
});

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

export const row = style([
  root,
  {
    display: "flex",
    alignItems: "center",
    minHeight: "2.5rem",
    padding: "0.5rem 0.75rem",
    boxSizing: "border-box",
  },
]);

export const rowSplit = style({
  gap: 16,
});

export const statusRow = style({
  display: "flex",
  gap: 10,
  alignItems: "center",
  minWidth: 0,
});

globalStyle(`${row} ${statusRow}`, {
  margin: 0,
  width: "100%",
});

globalStyle(`${row} ${toggleRoot}`, {
  margin: 0,
  width: "fit-content",
  maxWidth: "100%",
});

globalStyle(`${rowSplit} ${toggleRoot}`, {
  flex: "0 1 auto",
  minWidth: 0,
});

export const warn = style([
  root,
  {
    background: "var(--warn-bg)",
    borderColor: "transparent",
  },
]);

export const warnPlain = style([
  plain,
  {
    padding: `10px ${panelPaddingX}px`,
    borderRadius: "var(--radius)",
    background: "var(--warn-bg)",
  },
]);

globalStyle(`${warn} h2`, {
  margin: "0 0 4px",
  fontSize: "0.95rem",
  color: "var(--warn-ink)",
});

globalStyle(`${warn} p`, {
  margin: "0 0 8px",
  color: "var(--warn-ink)",
  fontSize: "0.84rem",
});
