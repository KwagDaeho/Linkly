import { globalStyle, style } from "@vanilla-extract/css";

export const root = style({
  display: "grid",
  gap: 6,
});

export const groupTitle = style({
  margin: "4px 0 0",
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
});

export const shell = style({
  display: "grid",
  gap: 6,
});

export const trigger = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  margin: 0,
  padding: "8px 10px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--panel)",
  color: "var(--ink)",
  fontWeight: 700,
  fontSize: "0.9rem",
  textAlign: "left",
  cursor: "pointer",
});

export const chevron = style({
  display: "inline-block",
  fontSize: "1.1rem",
  lineHeight: 1,
  transition: "transform 0.15s ease",
  selectors: {
    '&[data-open=""]': {
      transform: "rotate(90deg)",
    },
  },
});

export const triggerText = style({
  flex: 1,
  minWidth: 0,
});

export const panel = style({
  display: "grid",
  gap: 8,
  selectors: {
    '&:not([data-open=""])': {
      display: "none",
    },
  },
});

globalStyle(`${panel} > section`, {
  margin: 0,
});
