import { style } from "@vanilla-extract/css";

import { shellSideInsetPx } from "@/components/ui/panelLayout";

const shellHorizontalInset = shellSideInsetPx * 2;

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
  boxSizing: "border-box",
  width: `calc(100% - ${shellHorizontalInset}px)`,
  maxWidth: "none",
  padding: "12px 0 20px",
});

export const loadingTag = style({
  margin: 0,
  fontSize: "1.08rem",
  fontWeight: 650,
  letterSpacing: "0.08em",
  color: "var(--muted)",
});
