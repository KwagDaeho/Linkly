import { style } from "@vanilla-extract/css";

/** Plain inline row (no frame). */
export const inline = style({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.375rem",
  padding: "0.25rem 0",
  fontSize: "0.92rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "var(--ink)",
});

/** Hold-capture / key input — fixed height for idle, listening, and confirmed. */
/** Status line in field capture (waiting + in-progress). */
export const fieldStatus = style({
  fontSize: "0.92rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "var(--ink)",
});

export const field = style({
  boxSizing: "border-box",
  width: "100%",
  height: "3.15rem",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  alignContent: "center",
  gap: "0.375rem",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px dashed var(--line)",
  background: "var(--accent-soft)",
  fontSize: "0.92rem",
  fontWeight: 600,
  letterSpacing: "0.02em",
  color: "var(--ink)",
  textAlign: "center",
  overflow: "hidden",
});

export const error = style({
  margin: "0.35rem 0 0",
  fontSize: "0.85rem",
  color: "var(--danger, #c0392b)",
});
