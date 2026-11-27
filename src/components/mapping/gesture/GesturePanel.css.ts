import { globalStyle, style } from "@vanilla-extract/css";

export const keys = style({
  display: "grid",
  gap: 12,
  marginBottom: 14,
});

export const list = style({
  display: "grid",
  gap: 6,
});

export const row = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  minHeight: "2rem",
  padding: "0.25rem 0.5rem 0.25rem 0.4rem",
  border: "1px solid var(--line)",
  borderRadius: "0.5rem",
  background: "var(--accent-soft)",
});

globalStyle(`${row} [data-action-select]`, {
  minWidth: 0,
  width: "100%",
});

export const thumbButton = style({
  display: "grid",
  placeItems: "center",
  padding: 2,
  border: "1px solid var(--line)",
  borderRadius: 6,
  background: "var(--panel-solid)",
  color: "var(--accent)",
  cursor: "pointer",
  selectors: {
    "&:hover": {
      borderColor: "var(--interaction-hover-border)",
    },
  },
});

export const thumb = style({
  display: "block",
  width: 56,
  height: 36,
});

export const drawHint = style({
  margin: "0 0 10px",
  fontSize: "0.82rem",
  lineHeight: 1.4,
  whiteSpace: "pre-line",
});

export const canvas = style({
  display: "block",
  width: "100%",
  aspectRatio: "440 / 260",
  boxSizing: "border-box",
  border: "1px dashed var(--line-accent)",
  borderRadius: 10,
  background: "var(--panel-solid)",
  touchAction: "none",
});

export const description = style({
  margin: "0 0 14px",
  fontSize: "0.84rem",
  lineHeight: 1.5,
});
