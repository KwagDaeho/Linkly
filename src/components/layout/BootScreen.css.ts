import { style } from "@vanilla-extract/css";

import { shellSideInsetPx } from "@/components/ui/panelLayout";

import { title } from "./AppHeader.css";

const shellHorizontalInset = shellSideInsetPx * 2;

/** Header logo is 84px; boot screen uses 2×. */
const BOOT_LOGO_FONT_PX = 84 * 2;

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

export const bootMark = style([
  title,
  {
    fontSize: `${BOOT_LOGO_FONT_PX}px`,
  },
]);

export const loadingTag = style({
  margin: 0,
  fontSize: "1.08rem",
  fontWeight: 650,
  letterSpacing: "0.08em",
  color: "var(--muted)",
});
