import { style } from "@vanilla-extract/css";

export const root = style({
  display: "grid",
  gap: 8,
});

export const title = style({
  margin: "4px 0 0",
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
});

export const body = style({
  display: "grid",
  gap: 8,
});
