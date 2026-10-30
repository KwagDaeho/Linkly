import { globalStyle, style } from "@vanilla-extract/css";

import {
  contentIndent,
  headingH2,
  headingH3,
  headingShell,
  headingRow,
} from "./sectionTitle.css";

export const root = style({
  display: "grid",
  gap: 8,
  marginBottom: 6,
  paddingBottom: 10,
  borderBottom: "1px solid color-mix(in srgb, var(--line) 65%, transparent)",
  selectors: {
    "&:last-child": {
      borderBottom: "none",
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
});

export const heading = headingShell;

export const headingToggle = style([
  headingRow,
  {
    margin: 0,
    border: 0,
    borderRadius: 0,
    background: "transparent",
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
    font: "inherit",
  },
]);

const headingTextBase = {
  flex: 1,
  minWidth: 0,
} as const;

export const headingTextH2 = style([headingH2, headingTextBase]);

export const headingTextH3 = style([headingH3, headingTextBase]);

export const status = style({
  flexShrink: 0,
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--muted)",
  selectors: {
    '&[data-on=""]': {
      color: "var(--ok)",
    },
  },
});

const panelEase = "cubic-bezier(0.4, 0, 0.2, 1)";
const panelDuration = "0.38s";

export const chevron = style({
  display: "inline-grid",
  placeItems: "center",
  width: "1.1rem",
  height: "1.1rem",
  fontSize: "0.95rem",
  lineHeight: 1,
  color: "var(--muted)",
  transition: `transform ${panelDuration} ${panelEase}`,
  flexShrink: 0,
  selectors: {
    '&[data-open=""]': {
      transform: "rotate(90deg)",
    },
  },
});

export const panel = style({
  display: "grid",
  gridTemplateRows: "0fr",
  overflow: "hidden",
  transition: `grid-template-rows ${panelDuration} ${panelEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
  selectors: {
    '&[data-open=""]': {
      gridTemplateRows: "1fr",
    },
  },
});

export const panelInner = style([
  contentIndent,
  {
    minHeight: 0,
    overflow: "hidden",
    opacity: 0,
    transition: `opacity 0.28s ${panelEase}`,
    "@media": {
      "(prefers-reduced-motion: reduce)": {
        transition: "none",
      },
    },
  },
]);

globalStyle(`${panel}[data-open=""] ${panelInner}`, {
  opacity: 1,
});

globalStyle(`${panelInner} > section`, {
  margin: 0,
});
