import { style } from "@vanilla-extract/css";

import { tabTransitionEase, tabTransitionMs } from "@/components/ui/panelLayout";

export const root = style({
  paddingTop: 6,
  overflow: "hidden",
});

export const track = style({
  display: "flex",
  alignItems: "flex-start",
  width: "200%",
  willChange: "transform",
  transition: `transform ${tabTransitionMs}ms ${tabTransitionEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
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
