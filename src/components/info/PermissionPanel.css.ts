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

export const permRestarting = style({
  margin: "4px 0 0",
  color: "var(--ink)",
  fontSize: "0.9rem",
});
