import { globalStyle, style } from "@vanilla-extract/css";

/** Shared look for drag-to-reorder lists (macro steps, trigger rows). */

export const dragHandle = style({
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  padding: "0.25rem 0.2rem",
  border: 0,
  borderRadius: 6,
  background: "transparent",
  font: "inherit",
  color: "var(--muted)",
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
  selectors: {
    "&:active": {
      cursor: "grabbing",
    },
  },
});

export const dragDots = style({
  fontSize: "0.72rem",
  lineHeight: 1,
  letterSpacing: "-0.08em",
  pointerEvents: "none",
});

/**
 * Row whose handle is hovered or being dragged. The 2px ring stays inside the row
 * (border + inset shadow) so a scrolling parent never clips it.
 */
export const rowHighlighted = style({
  borderColor: "var(--accent) !important",
  boxShadow: "inset 0 0 0 1px var(--accent)",
});

export const rowDragging = style({
  position: "relative",
  zIndex: 2,
  boxShadow:
    "0 8px 22px color-mix(in srgb, var(--ink) 16%, transparent), inset 0 0 0 1px var(--accent)",
  transition: "none",
  willChange: "transform",
});

export const listDragging = style({});

globalStyle(`${listDragging} > *:not(${rowDragging})`, {
  transition: "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
});
