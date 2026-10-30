import { style } from "@vanilla-extract/css";

export const root = style({
  paddingTop: 6,
  overflow: "hidden",
  touchAction: "pan-y pinch-zoom",
  cursor: "grab",
  selectors: {
    "&[data-dragging='true']": {
      cursor: "grabbing",
    },
  },
});

export const track = style({
  display: "flex",
  alignItems: "flex-start",
  width: "200%",
  willChange: "transform",
});

export const page = style({
  flex: "0 0 50%",
  minWidth: 0,
  boxSizing: "border-box",
});

export const pageInactive = style({
  pointerEvents: "none",
  userSelect: "none",
});

/** Off-screen tab must not stretch layout (Link is taller than Info). */
export const pageCollapsed = style({
  height: 0,
  minHeight: 0,
  overflow: "hidden",
  opacity: 0,
});
