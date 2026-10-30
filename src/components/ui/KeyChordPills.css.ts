import { style } from "@vanilla-extract/css";

/** Match app buttons — rounded chip, not full capsule. */
const chipRadius = 7;

export const row = style({
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
  alignItems: "center",
});

export const rowCompact = style({
  gap: 4,
  justifyContent: "flex-start",
});

export const rowCompactCenter = style({
  gap: 4,
  justifyContent: "center",
});

export const pill = style({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.28rem 0.62rem",
  borderRadius: chipRadius,
  background: "var(--accent)",
  color: "var(--accent-ink, #1a1020)",
  fontSize: "0.82rem",
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: "0.02em",
});

export const pillCompact = style({
  padding: "0.22rem 0.5rem",
  fontSize: "0.8rem",
  lineHeight: 1.15,
});

export const prefix = style({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.28rem 0.55rem",
  borderRadius: chipRadius,
  border: "1px solid var(--line)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: "0.78rem",
  fontWeight: 600,
});

export const prefixCompact = style({
  padding: "0.2rem 0.42rem",
  fontSize: "0.78rem",
});
