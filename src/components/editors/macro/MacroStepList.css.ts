import { style } from "@vanilla-extract/css";

export const stepsArea = style({
  maxHeight: "22.5rem",
});

export const stepItem = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "5px 8px",
  borderRadius: 7,
  border: "1px solid var(--line)",
  background: "var(--accent-soft)",
  fontWeight: 600,
  fontSize: "0.86rem",
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 5,
});

export const dragZone = style({
  margin: "-4px 0 -4px -6px",
  padding: "4px 8px 4px 6px",
});

export const order = style({
  flex: "0 0 auto",
  minWidth: "1.2rem",
  textAlign: "center",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "var(--muted)",
  pointerEvents: "none",
});

export const actions = style({
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  gap: 2,
});

export const label = style({
  flex: "1 1 auto",
  minWidth: 0,
});
