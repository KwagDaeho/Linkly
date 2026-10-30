import { style } from "@vanilla-extract/css";

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const item = style({
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "8px 10px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--line)",
  background: "var(--panel)",
});

export const dot = style({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "var(--muted)",
  flexShrink: 0,
  marginTop: 5,
});

export const dotOn = style({
  background: "var(--ok)",
  boxShadow: "0 0 0 4px var(--ok-glow)",
});

export const meta = style({
  display: "flex",
  flexDirection: "column",
  gap: 2,
  minWidth: 0,
});

export const name = style({
  fontSize: "0.92rem",
  fontWeight: 600,
  lineHeight: 1.25,
});

export const detail = style({
  fontSize: "0.78rem",
  lineHeight: 1.3,
});

export const empty = style({
  margin: 0,
  fontSize: "0.84rem",
  color: "var(--muted)",
});

export const error = style({
  margin: 0,
  fontSize: "0.84rem",
  color: "var(--danger, #c44)",
});
