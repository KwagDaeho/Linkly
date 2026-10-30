import { style } from "@vanilla-extract/css";

const rowGrid = {
  display: "grid",
  gridTemplateColumns: "8px minmax(0, 1fr) 3.25rem",
  columnGap: 10,
  alignItems: "center",
} as const;

export const table = style({
  display: "flex",
  flexDirection: "column",
  gap: 6,
});

export const headerRow = style([
  rowGrid,
  {
    padding: "0 10px 2px",
  },
]);

export const headerSpacer = style({
  width: 8,
});

export const headerDevice = style({
  minWidth: 0,
});

export const headerLink = style({
  justifySelf: "center",
  textAlign: "center",
  fontSize: "0.72rem",
  fontWeight: 650,
  letterSpacing: "0.02em",
  color: "var(--muted)",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
});

export const list = style({
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
});

export const item = style([
  rowGrid,
  {
    padding: "8px 10px",
    borderRadius: "var(--radius)",
    border: "1px solid var(--line)",
    background: "var(--panel)",
    alignItems: "flex-start",
    willChange: "transform",
  },
]);

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

export const actions = style({
  justifySelf: "center",
  alignSelf: "center",
  paddingTop: 2,
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

export const transportRow = style({
  display: "inline",
});

export const transportSep = style({
  color: "var(--muted)",
  opacity: 0.45,
});

export const transportChip = style({
  fontWeight: 500,
});

export const transportActive = style({
  color: "var(--text)",
  opacity: 1,
});

export const transportInactive = style({
  color: "var(--muted)",
  opacity: 0.45,
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
