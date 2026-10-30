import { globalStyle, style } from "@vanilla-extract/css";

import {
  accordionRailBorderPx,
  sectionContentPadLeft,
} from "./panelLayout";
import {
  headingH2,
  headingH3,
  headingShell,
  headingRow,
} from "./sectionTitle.css";

const panelEase = "cubic-bezier(0.4, 0, 0.2, 1)";
const panelDuration = "0.38s";

export const root = style({
  display: "grid",
  gap: 0,
  marginBottom: 0,
  paddingBottom: 6,
  borderBottom: "1px solid var(--line-accent)",
  transition: `gap ${panelDuration} ${panelEase}, padding-bottom ${panelDuration} ${panelEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
  selectors: {
    '&[data-open=""]': {
      gap: 6,
      paddingBottom: 0,
    },
    "&:last-child": {
      borderBottom: "none",
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const heading = headingShell;

const headingPadY = 5;

export const headingToggle = style([
  headingRow,
  {
    gap: 4,
    alignItems: "center",
    margin: 0,
    border: 0,
    borderRadius: 6,
    background: "transparent",
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "inherit",
    boxSizing: "border-box",
    width: "100%",
    padding: `${headingPadY}px ${headingPadY * 2}px ${headingPadY}px 0`,
    minHeight: "unset",
    selectors: {
      "&:focus-visible": {
        outline: "2px solid var(--accent)",
        outlineOffset: 2,
      },
    },
  },
]);

const headingTextBase = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  minHeight: "28px",
} as const;

export const headingTextH2 = style([headingH2, headingTextBase]);

export const headingTextH3 = style([headingH3, headingTextBase]);

/** Keep subtle hover; global `button:hover` must not apply (see theme.css). */
globalStyle(`${headingToggle}:hover:not(:disabled)`, {
  background: "color-mix(in srgb, var(--accent-soft) 55%, transparent)",
});

export const status = style({
  flexShrink: 0,
  fontSize: "0.74rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "none",
  color: "var(--muted)",
  selectors: {
    '&[data-on=""]': {
      color: "var(--accent)",
    },
  },
});

export const chevron = style({
  display: "grid",
  placeItems: "center",
  width: "28px",
  height: "28px",
  fontSize: "24px",
  lineHeight: 1,
  color: "var(--muted)",
  transform: "translateY(-2px)",
  transformOrigin: "50% 50%",
  transition: `transform ${panelDuration} ${panelEase}`,
  flexShrink: 0,
  selectors: {
    '&[data-open=""]': {
      transform: "translateY(-2px) rotate(90deg)",
    },
  },
});

export const panel = style({
  display: "grid",
  gridTemplateRows: "0fr",
  overflow: "hidden",
  paddingBottom: 0,
  transition: `grid-template-rows ${panelDuration} ${panelEase}, padding-bottom ${panelDuration} ${panelEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
  selectors: {
    '&[data-open=""]': {
      gridTemplateRows: "1fr",
      paddingBottom: 16,
    },
  },
});

export const panelInner = style({
  display: "grid",
  gap: 10,
  fontSize: "0.9375rem",
  minHeight: 0,
  overflow: "hidden",
  marginLeft: 0,
  paddingLeft: sectionContentPadLeft,
  paddingTop: 0,
  paddingBottom: 0,
  paddingRight: 0,
  borderLeft: `${accordionRailBorderPx}px solid color-mix(in srgb, var(--line) 72%, transparent)`,
  opacity: 0,
  transition: `opacity ${panelDuration} ${panelEase}, padding-top ${panelDuration} ${panelEase}, padding-bottom ${panelDuration} ${panelEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

globalStyle(`${panel}[data-open=""] ${panelInner}`, {
  opacity: 1,
  paddingTop: 6,
  paddingBottom: 12,
});

globalStyle(`${panelInner} > section`, {
  margin: 0,
});
