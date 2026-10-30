import { globalStyle, style } from "@vanilla-extract/css";

import {
  chromeSegmentButtonPadYRem,
  chromeSegmentIconRem,
  chromeSegmentPaddingPx,
  chromeSegmentPillRadiusPx,
  chromeSegmentRadiusPx,
  tabTransitionEase,
  tabTransitionMs,
} from "@/components/ui/panelLayout";

/** Font scale row — px only, fixed size (top-right). */
const fontScaleHeight = 34;
const fontScaleWidth = 112;
const fontScaleSide = 34;
const fontScaleMid = 44;

const fontScalePill = {
  display: "inline-flex",
  alignItems: "stretch",
  width: `${fontScaleWidth}px`,
  height: `${fontScaleHeight}px`,
  border: "1px solid var(--line)",
  borderRadius: chromeSegmentRadiusPx,
  overflow: "hidden",
  background: "var(--panel)",
  flexShrink: 0,
} as const;

export const hero = style({
  padding: "8px 2px 0",
  marginBottom: "1.85rem",
});

/** px/vw — not scaled with app font-size preference */
export const title = style({
  margin: 0,
  fontFamily: '"Futura", "Avenir Next", "Gill Sans", sans-serif',
  fontWeight: 700,
  fontSize: "84px",
  lineHeight: 1.2,
  letterSpacing: "-0.09em",
  color: "var(--accent)",
  userSelect: "none",
  WebkitUserSelect: "none",
});

export const heroTop = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
});

export const toolbarStack = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 12,
  flexShrink: 0,
  alignSelf: "flex-start",
});

export const toolbarRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
});

export const headerSegment = style({
  position: "relative",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  alignItems: "stretch",
  gap: chromeSegmentPaddingPx,
  padding: chromeSegmentPaddingPx,
  border: "1px solid var(--line)",
  borderRadius: chromeSegmentRadiusPx,
  overflow: "hidden",
  background: "var(--panel)",
  flexShrink: 0,
});

export const headerSegmentPill = style({
  position: "absolute",
  zIndex: 0,
  borderRadius: chromeSegmentPillRadiusPx,
  background: "var(--accent)",
  pointerEvents: "none",
  transition: `left ${tabTransitionMs}ms ${tabTransitionEase}, top ${tabTransitionMs}ms ${tabTransitionEase}, width ${tabTransitionMs}ms ${tabTransitionEase}, height ${tabTransitionMs}ms ${tabTransitionEase}`,
  selectors: {
    '&[data-nudge="true"]': {
      transition:
        "left 0.15s ease, top 0.15s ease, width 0.15s ease, height 0.15s ease",
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

export const headerSegmentButton = style({
  position: "relative",
  zIndex: 1,
  border: 0,
  borderRadius: 0,
  background: "transparent",
  color: "var(--muted)",
  padding: `${chromeSegmentButtonPadYRem}rem 0.55rem`,
  width: "100%",
  minWidth: 0,
  alignSelf: "stretch",
  minHeight: `calc(${chromeSegmentIconRem}rem + ${chromeSegmentButtonPadYRem * 2}rem)`,
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  WebkitAppearance: "none",
  appearance: "none",
  transition: `color ${tabTransitionMs}ms ${tabTransitionEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

export const headerSegmentButtonActive = style({
  color: "var(--accent-ink)",
});

globalStyle(`${headerSegmentButton} svg`, {
  width: `${chromeSegmentIconRem}rem`,
  height: `${chromeSegmentIconRem}rem`,
  display: "block",
  flexShrink: 0,
});

export const fontScaleToggle = style(fontScalePill);

export const fontScaleValue = style({
  flex: `1 0 ${fontScaleMid}px`,
  width: `${fontScaleMid}px`,
  padding: 0,
  fontSize: "13px",
  fontWeight: 700,
  fontVariantNumeric: "tabular-nums",
  color: "var(--muted)",
  textAlign: "center",
  lineHeight: `${fontScaleHeight}px`,
  userSelect: "none",
});

export const fontScaleButton = style({
  border: 0,
  borderRadius: 0,
  background: "transparent",
  color: "var(--muted)",
  flex: `0 0 ${fontScaleSide}px`,
  width: `${fontScaleSide}px`,
  minWidth: `${fontScaleSide}px`,
  height: `${fontScaleHeight}px`,
  padding: 0,
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: 1,
  display: "inline-grid",
  placeItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
});

export const fontScaleButtonDisabled = style({
  opacity: 0.35,
  cursor: "not-allowed",
});

globalStyle(`${fontScaleButton}:hover:not(:disabled)`, {
  background: "var(--chrome-subtle-hover) !important",
});
