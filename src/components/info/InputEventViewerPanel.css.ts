import { globalStyle, style } from "@vanilla-extract/css";

export const toolbar = style({
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 10,
});

export const block = style({
  marginBottom: 14,
  selectors: {
    "&:last-child": { marginBottom: 0 },
  },
});

export const blockHead = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 4,
});

export const rowLabel = style({
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--muted)",
  letterSpacing: "0.02em",
});

export const rowInput = style({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  margin: "0 0 6px",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--probe-bg)",
  color: "var(--ink)",
  fontFamily: '"Menlo", "SF Mono", monospace',
  fontSize: "0.78rem",
  selectors: {
    "&::placeholder": {
      color: "var(--muted)",
      fontFamily: "inherit",
    },
  },
});

export const log = style({
  maxHeight: 200,
  overflow: "auto",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--probe-bg)",
  padding: "4px 0",
  fontFamily: '"Menlo", "SF Mono", monospace',
  fontSize: "0.72rem",
});

export const logEmpty = style({
  margin: 0,
  padding: "10px 12px",
  color: "var(--muted)",
});

export const row = style({
  display: "grid",
  gridTemplateColumns: "5.5rem 1fr",
  gap: 8,
  padding: "3px 10px",
  alignItems: "baseline",
  selectors: {
    "&:nth-child(even)": {
      background: "rgba(127, 127, 127, 0.06)",
    },
  },
});

export const time = style({
  color: "var(--muted)",
  whiteSpace: "nowrap",
});

export const summary = style({
  color: "var(--probe-fg)",
  wordBreak: "break-word",
});

export const windowRoot = style({
  padding: 16,
  flex: 1,
  minHeight: 0,
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

export const viewerShell = style({
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

export const windowPanel = style({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
});

export const windowHead = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
  marginBottom: 10,
  flexShrink: 0,
});

export const windowActions = style({
  display: "flex",
  alignItems: "center",
  gap: 8,
});

export const memoInput = style({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  margin: "0 0 10px",
  padding: "10px 12px",
  flexShrink: 0,
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--panel-solid)",
  color: "var(--ink)",
  fontSize: "0.92rem",
  fontFamily: "inherit",
  lineHeight: 1.35,
  selectors: {
    "&::placeholder": {
      color: "var(--muted)",
    },
    "&:focus": {
      outline: "none",
      borderColor: "var(--accent)",
      boxShadow: "0 0 0 3px var(--accent-soft)",
    },
  },
});

export const logScrollWrap = style({
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

globalStyle(`${logScrollWrap} > div`, {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
});

export const logTall = style([
  log,
  {
    flex: 1,
    minHeight: 0,
    maxHeight: "none",
  },
]);
