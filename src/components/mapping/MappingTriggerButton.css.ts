import { style } from "@vanilla-extract/css";

/** Transparent hit target — pills keep accent styling; no panel/chip wrapper. */
export const trigger = style({
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  cursor: "pointer",
  textAlign: "left",
  lineHeight: 1.15,
});

export const unsetChip = style({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.5rem",
  borderRadius: "0.4375rem",
  border: "1px dashed var(--line)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: "0.8rem",
  fontWeight: 650,
  lineHeight: 1.15,
});
