import { style } from "@vanilla-extract/css";

export const screen = style({
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
});

export const stack = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 32,
  textAlign: "center",
  maxWidth: "min(780px, 100%)",
  padding: "12px 16px 20px",
});

export const loadingTag = style({
  margin: 0,
  fontSize: "0.94rem",
  fontWeight: 650,
  letterSpacing: "0.08em",
  color: "var(--muted)",
});
