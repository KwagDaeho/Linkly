import { style } from "@vanilla-extract/css";

export const help = style({
  margin: "0 0 8px",
  fontSize: "0.82rem",
  color: "var(--muted)",
});

export const headline = style({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  margin: "0 0 6px",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: 999,
  background: "var(--probe-bg)",
  color: "var(--ink)",
  fontFamily: '"Menlo", "SF Mono", monospace',
  fontSize: "0.78rem",
});

export const filter = style({
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  margin: "0 0 8px",
  padding: "8px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--panel)",
  color: "var(--ink)",
  fontSize: "0.84rem",
});

export const toolbar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginBottom: 8,
  flexWrap: "wrap",
});

export const log = style({
  maxHeight: 320,
  overflow: "auto",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--probe-bg)",
  padding: "6px 0",
  fontFamily: '"Menlo", "SF Mono", monospace',
  fontSize: "0.72rem",
});

export const empty = style({
  margin: 0,
  padding: "12px 10px",
  color: "var(--muted)",
});

export const row = style({
  display: "grid",
  gridTemplateColumns: "5.5rem 2.2rem 1fr",
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

export const source = style({
  fontWeight: 700,
  textTransform: "uppercase",
  fontSize: "0.65rem",
  selectors: {
    '&[data-source="hid"]': { color: "var(--accent)" },
    '&[data-source="os"]': { color: "#6a9bcc" },
  },
});

export const summary = style({
  color: "var(--probe-fg)",
  wordBreak: "break-word",
});
