import { style } from "@vanilla-extract/css";

export const banner = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
  margin: "0 0 1.1rem",
  padding: "0.6rem 0.75rem 0.6rem 1rem",
  borderRadius: 10,
  border: "1px solid var(--line-accent)",
  background: "var(--accent-soft)",
  fontSize: "0.86rem",
});

export const text = style({
  flex: 1,
  minWidth: 0,
  fontWeight: 600,
});

export const later = style({
  background: "transparent",
  color: "var(--muted)",
  fontWeight: 600,
});
