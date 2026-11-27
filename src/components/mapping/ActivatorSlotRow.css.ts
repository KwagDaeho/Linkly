import { style } from "@vanilla-extract/css";

export const row = style({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: 10,
  rowGap: 6,
  width: "100%",
  fontSize: "0.92rem",
});

export const label = style({
  margin: 0,
  padding: 0,
  fontWeight: 600,
  lineHeight: 1.35,
});

export const key = style({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
});

export const help = style({
  flexBasis: "100%",
  width: "100%",
  margin: 0,
  fontSize: "0.78rem",
  lineHeight: 1.35,
});
