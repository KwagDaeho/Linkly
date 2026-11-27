import { style } from "@vanilla-extract/css";

import { chromeSegmentPaddingPx } from "@/components/ui/panelLayout";

/** Main tab-bar chrome (AppShell `tabs`) with content-sized, wrapping tabs. */
export const list = style({
  position: "relative",
  display: "flex",
  flexWrap: "wrap",
  width: "fit-content",
  maxWidth: "100%",
  gap: chromeSegmentPaddingPx,
  padding: chromeSegmentPaddingPx,
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--panel)",
  userSelect: "none",
  WebkitUserSelect: "none",
});

export const item = style({
  maxWidth: "12rem",
  gap: 6,
  fontSize: "0.78rem",
});

export const label = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
});

export const muted = style({
  opacity: 0.55,
});

export const suffix = style({
  fontSize: "0.7rem",
  fontWeight: 600,
  opacity: 0.75,
});
