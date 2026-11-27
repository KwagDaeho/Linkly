import { globalStyle, style } from "@vanilla-extract/css";

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
  fontSize: "0.88rem",
});

// Beats the shared tab padding/alignment (`AppShell.css` tab) regardless of CSS order:
// tighter than the main tab bar, and baseline keeps the count level with the label.
globalStyle(`${list} > ${item}`, {
  padding: "0.3rem 0.75rem",
  alignItems: "baseline",
});

export const label = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  // The tab is line-height 1; give glyphs room so `overflow: hidden` doesn't clip Hangul tops.
  lineHeight: 1.35,
});

export const muted = style({
  opacity: 0.55,
});

export const suffix = style({
  fontSize: "0.78rem",
  fontWeight: 600,
  lineHeight: 1.35,
  opacity: 0.75,
});

/** Tab list + optional reorder controls at its end. */
export const row = style({
  display: "flex",
  alignItems: "stretch",
  flexWrap: "wrap",
  gap: 8,
});

export const listEditing = style({
  borderStyle: "dashed",
  borderColor: "var(--line-accent)",
});

export const tabMovable = style({
  cursor: "grab",
  touchAction: "none",
  color: "var(--ink)",
  boxShadow: "inset 0 0 0 1px var(--line)",
});

export const tabLocked = style({
  cursor: "default",
  opacity: 0.45,
});

/** Hovered or dragged tab: the same accent outline as reordered rows. */
export const tabHighlighted = style({
  boxShadow: "inset 0 0 0 2px var(--accent)",
});

export const tabDragging = style({
  cursor: "grabbing",
  zIndex: 2,
  background: "var(--panel-solid)",
  boxShadow:
    "0 6px 18px color-mix(in srgb, var(--ink) 18%, transparent), inset 0 0 0 2px var(--accent)",
  willChange: "transform",
});

export const reorderControls = style({
  display: "inline-flex",
  alignItems: "stretch",
  gap: 6,
});

/** Square icon button, same height as the tab list; plain until hovered. */
export const iconButton = style({
  minWidth: "2.4rem",
  padding: "0 0.6rem",
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--panel)",
  color: "var(--muted)",
  fontSize: "1rem",
  fontWeight: 700,
  lineHeight: 1,
  selectors: {
    // The global button hover fills with the accent: keep the icon readable on it.
    "&:hover:not(:disabled)": {
      color: "var(--accent-ink)",
      borderColor: "var(--interaction-hover-border)",
    },
  },
});

export const iconConfirm = style({
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "var(--accent-ink)",
});
