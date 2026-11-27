import { style } from "@vanilla-extract/css";

export const fields = style({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  columnGap: 14,
  rowGap: 8,
  margin: 0,
  fontSize: "0.86rem",
});

export const term = style({
  color: "var(--muted)",
  fontWeight: 600,
});

export const value = style({
  margin: 0,
  color: "var(--ink)",
  overflowWrap: "anywhere",
});

export const nameField = style({
  display: "grid",
  gap: 6,
  fontSize: "0.86rem",
  fontWeight: 600,
});

export const nameInput = style({
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 7,
  border: "1px solid var(--line)",
  background: "var(--panel-solid)",
  padding: "0.4rem 0.6rem",
  color: "var(--ink)",
  fontSize: "0.86rem",
  fontWeight: 400,
  selectors: {
    "&:focus": {
      outline: "none",
      borderColor: "var(--interaction-hover-border)",
      boxShadow: "0 0 0 3px var(--accent-soft)",
    },
  },
});
