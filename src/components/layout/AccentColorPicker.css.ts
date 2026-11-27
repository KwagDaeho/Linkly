import { globalStyle, style } from "@vanilla-extract/css";

import {
  chromeSegmentButtonPadYRem,
  chromeSegmentIconRem,
  chromeSegmentPaddingPx,
  chromeSegmentRadiusPx,
} from "@/components/ui/panelLayout";

/** Same outer height as the header segment toggles (icon + padding + border). */
const triggerSize = `calc(${chromeSegmentIconRem + chromeSegmentButtonPadYRem * 2}rem + ${chromeSegmentPaddingPx * 2 + 2}px)`;

/** Popover sizes are in rem so it scales with the app font size. */
export const root = style({
  position: "relative",
  display: "inline-flex",
  flexShrink: 0,
});

export const trigger = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  // Square at any app font scale.
  width: triggerSize,
  height: triggerSize,
  flexShrink: 0,
  padding: 0,
  border: "1px solid var(--line)",
  borderRadius: chromeSegmentRadiusPx,
  transition: "border-color 0.15s ease",
  selectors: {
    "&:hover, &[aria-expanded='true']": {
      borderColor: "var(--interaction-hover-border)",
    },
  },
});

/** Pie-slice color wheel: reads as "change color", not as the current color. */
export const triggerIcon = style({
  width: `${chromeSegmentIconRem}rem`,
  height: `${chromeSegmentIconRem}rem`,
  borderRadius: "50%",
  background:
    "conic-gradient(#f06b6b 0 60deg, #f2b04a 60deg 120deg, #e8dc5a 120deg 180deg, #5cc489 180deg 240deg, #5b9df0 240deg 300deg, #b27be6 300deg 360deg)",
  boxShadow: "0 0 0 1.5px var(--panel-solid), 0 0 0 2.5px color-mix(in srgb, var(--ink) 22%, transparent)",
});

export const popover = style({
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  zIndex: 60,
  width: "15rem",
  padding: "0.875rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  borderRadius: "0.75rem",
  border: "1px solid var(--line)",
  background: "var(--panel-solid)",
  boxShadow: "0 10px 30px var(--shadow)",
});

export const head = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "var(--heading-h3)",
});

export const reset = style({
  padding: "0.12rem 0.45rem",
  fontSize: "0.72rem",
  fontWeight: 600,
  color: "var(--muted)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  selectors: {
    "&:hover:not(:disabled)": {
      color: "var(--ink)",
      borderColor: "var(--interaction-hover-border)",
    },
  },
});

export const wheelWrap = style({
  position: "relative",
  alignSelf: "center",
  width: "11rem",
  height: "11rem",
  touchAction: "none",
  cursor: "crosshair",
});

export const wheel = style({
  display: "block",
  width: "100%",
  height: "100%",
  borderRadius: "50%",
});

export const marker = style({
  position: "absolute",
  width: 16,
  height: 16,
  marginLeft: -8,
  marginTop: -8,
  borderRadius: "50%",
  border: "2px solid #fff",
  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3)",
  pointerEvents: "none",
});

export const brightness = style({});

globalStyle(`${brightness}::-webkit-slider-runnable-track`, {
  height: 8,
  background: "linear-gradient(to right, #000, var(--wheel-full))",
});

globalStyle(`${brightness}::-webkit-slider-thumb`, {
  marginTop: -3,
  background: "var(--accent)",
  borderColor: "#fff",
});

export const inputs = style({
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
  gap: "0.375rem",
});

export const field = style({
  display: "flex",
  flexDirection: "column",
  gap: 3,
  fontSize: "0.66rem",
  fontWeight: 700,
  color: "var(--muted)",
  textAlign: "center",
});

export const fieldInput = style({
  width: "100%",
  minWidth: 0,
  padding: "0.26rem 0.3rem",
  fontSize: "0.78rem",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  borderRadius: 6,
  border: "1px solid var(--line)",
  background: "var(--panel-solid)",
  color: "var(--ink)",
  selectors: {
    "&:focus": {
      outline: "none",
      borderColor: "var(--interaction-hover-border)",
      boxShadow: "0 0 0 3px var(--accent-soft)",
    },
  },
});

globalStyle(`input[type='number']${fieldInput}`, {
  padding: "0.26rem 0.2rem",
  MozAppearance: "textfield",
});

globalStyle(`${fieldInput}::-webkit-inner-spin-button, ${fieldInput}::-webkit-outer-spin-button`, {
  WebkitAppearance: "none",
  margin: 0,
});

export const sectionLabel = style({
  fontSize: "0.7rem",
  fontWeight: 700,
  color: "var(--muted)",
  marginBottom: -4,
});

export const swatches = style({
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "0.5rem",
  justifyItems: "center",
});

export const swatch = style({
  width: "1.75rem",
  height: "1.75rem",
  padding: 0,
  borderRadius: "50%",
  transition: "box-shadow 0.15s ease, transform 0.15s ease",
  selectors: {
    "&:hover": {
      transform: "scale(1.08)",
    },
    "&[aria-pressed='true']": {
      boxShadow: "0 0 0 2px var(--panel-solid), 0 0 0 4px var(--ink)",
    },
  },
});
