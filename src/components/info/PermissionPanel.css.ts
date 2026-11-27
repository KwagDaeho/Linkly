import { globalStyle, style } from "@vanilla-extract/css";

export const permSteps = style({
  margin: "6px 0 10px",
  paddingLeft: "1.35rem",
  color: "var(--muted)",
  fontSize: "0.84rem",
  lineHeight: 1.45,
});

globalStyle(`${permSteps} li + li`, {
  marginTop: 4,
});

export const permList = style({
  margin: "8px 0 10px",
  paddingLeft: "1.2rem",
  color: "var(--muted)",
  fontSize: "0.92rem",
});

export const permRows = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
  margin: "4px 0 0",
  padding: 0,
  listStyle: "none",
});

export const permRow = style({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto auto",
  alignItems: "center",
  gap: 10,
  padding: "0.55rem 0.6rem 0.55rem 0.9rem",
  border: "1px solid var(--line)",
  borderRadius: "0.5rem",
});

export const permName = style({
  color: "var(--ink)",
  fontSize: "1rem",
  fontWeight: 650,
});

export const permState = style({
  color: "var(--muted)",
  fontSize: "0.9rem",
  fontWeight: 700,
});

export const permStateOn = style({
  color: "var(--accent)",
});

export const permActions = style({
  display: "inline-flex",
  justifyContent: "flex-end",
  gap: 6,
});

export const permRestarting = style({
  margin: "4px 0 0",
  color: "var(--ink)",
  fontSize: "0.9rem",
});
