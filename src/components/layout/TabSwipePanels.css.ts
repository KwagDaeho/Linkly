import { globalStyle, style } from "@vanilla-extract/css";

import { MAIN_TAB_COUNT } from "@/constants/tabs";
import { tabTransitionEase, tabTransitionMs } from "@/components/ui/panelLayout";

const trackWidthPercent = MAIN_TAB_COUNT * 100;
const pageBasisPercent = 100 / MAIN_TAB_COUNT;

export const root = style({
  flex: 1,
  minHeight: 0,
  paddingTop: 6,
  overflow: "hidden",
});

export const track = style({
  display: "flex",
  alignItems: "stretch",
  height: "100%",
  width: `${trackWidthPercent}%`,
  willChange: "transform",
  transition: `transform ${tabTransitionMs}ms ${tabTransitionEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

export const page = style({
  flex: `0 0 ${pageBasisPercent}%`,
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  boxSizing: "border-box",
});

export const pageScrollVisible = style({
  overflow: "visible",
});

export const pageNonInteractive = style({
  pointerEvents: "none",
  userSelect: "none",
});

export const pageScrollAuto = style({
  overflow: "auto",
  scrollbarWidth: "none",
});

globalStyle(`${pageScrollAuto}::-webkit-scrollbar`, {
  width: 0,
  height: 0,
  display: "none",
});
