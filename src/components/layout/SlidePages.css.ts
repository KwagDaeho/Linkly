import { style } from "@vanilla-extract/css";

import { tabTransitionEase, tabTransitionMs } from "@/components/ui/panelLayout";

const motion = (prop: string) => `${prop} ${tabTransitionMs}ms ${tabTransitionEase}`;

export const root = style({
  overflow: "hidden",
  transition: motion("height"),
  "@media": {
    "(prefers-reduced-motion: reduce)": { transition: "none" },
  },
});

export const track = style({
  display: "flex",
  alignItems: "flex-start",
  willChange: "transform",
  transition: motion("transform"),
  "@media": {
    "(prefers-reduced-motion: reduce)": { transition: "none" },
  },
});

export const page = style({
  minWidth: 0,
  boxSizing: "border-box",
});

export const pageInactive = style({
  pointerEvents: "none",
  userSelect: "none",
});
