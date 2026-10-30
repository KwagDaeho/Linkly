import { globalStyle, style } from "@vanilla-extract/css";

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
});

export const item = style({
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 0.625rem",
  borderRadius: "var(--radius)",
  border: "1px solid var(--line)",
  background: "var(--panel)",
});

export const itemStack = style([
  item,
  {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "0.375rem",
  },
]);

globalStyle(`${item} label`, {
  display: "grid",
  gap: 4,
  width: "100%",
  margin: 0,
  fontWeight: 600,
  fontSize: "0.92rem",
});

globalStyle(`${item} input[type="range"]`, {
  width: "100%",
});
