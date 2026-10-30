import { globalStyle, style } from "@vanilla-extract/css";

import { footer } from "@/components/info/ContactFooter.css";
import { root as accordionSection } from "@/components/ui/Accordion.css";
import {
  chromeSegmentPaddingPx,
  chromeSegmentPillRadiusPx,
  footerSpaceAboveBorderPx,
  sectionTabColumnWidthsRem,
  sectionTabDevicesFontRem,
  sectionTabFontRem,
  sectionTabPadXRem,
  sectionTabPadYRem,
  shellSectionGapPx,
  shellSideInsetPx,
  tabTransitionEase,
  tabTransitionMs,
  tabPillNudgeTransition,
} from "@/components/ui/panelLayout";
import { staticSection } from "@/components/ui/sectionTitle.css";

const shellHorizontalInset = shellSideInsetPx * 2;

export const shell = style({
  boxSizing: "border-box",
  width: `calc(100% - ${shellHorizontalInset}px)`,
  maxWidth: "none",
  margin: "0 auto",
  padding: "28px 0 28px",
  display: "grid",
  gap: shellSectionGapPx,
});

/** Guaranteed space above footer border (grid gap + this padding = footerSpaceAboveBorderPx). */
export const footerLead = style({
  paddingTop: footerSpaceAboveBorderPx - shellSectionGapPx,
});

const flushBeforeFooter = {
  borderBottom: "none",
  marginBottom: 0,
  paddingBottom: 0,
} as const;

globalStyle(`${shell} ${staticSection}:has(+ ${footer})`, flushBeforeFooter);
globalStyle(`${shell} ${accordionSection}:has(+ ${footer})`, flushBeforeFooter);

/** Tab panels — extra top inset so gap below tabs matches sectionGroupFollow (~14px). */
export const tabPanel = style({
  display: "grid",
  gap: 8,
  paddingTop: 6,
});

export const tabs = style({
  position: "relative",
  display: "grid",
  width: "fit-content",
  maxWidth: "100%",
  gridTemplateColumns: sectionTabColumnWidthsRem.map((w) => `${w}rem`).join(" "),
  alignItems: "stretch",
  gap: chromeSegmentPaddingPx,
  padding: chromeSegmentPaddingPx,
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--panel)",
  userSelect: "none",
  WebkitUserSelect: "none",
});

/** Slides under the active tab button. */
export const tabPill = style({
  position: "absolute",
  zIndex: 0,
  borderRadius: chromeSegmentPillRadiusPx,
  background: "var(--accent)",
  pointerEvents: "none",
  transition: `left ${tabTransitionMs}ms ${tabTransitionEase}, top ${tabTransitionMs}ms ${tabTransitionEase}, width ${tabTransitionMs}ms ${tabTransitionEase}, height ${tabTransitionMs}ms ${tabTransitionEase}`,
  selectors: {
    '&[data-nudge="true"]': {
      transition: tabPillNudgeTransition,
    },
  },
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

export const tab = style({
  position: "relative",
  zIndex: 1,
  border: 0,
  borderRadius: chromeSegmentPillRadiusPx,
  padding: `${sectionTabPadYRem}rem ${sectionTabPadXRem}rem`,
  minWidth: 0,
  alignSelf: "stretch",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  color: "var(--muted)",
  fontWeight: 700,
  fontSize: `${sectionTabFontRem}rem`,
  whiteSpace: "nowrap",
  cursor: "pointer",
  WebkitAppearance: "none",
  appearance: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  transition: `color ${tabTransitionMs}ms ${tabTransitionEase}`,
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

export const tabActive = style({
  color: "var(--accent-ink)",
});

export const tabDevices = style({
  fontSize: `${sectionTabDevicesFontRem}rem`,
  letterSpacing: "-0.02em",
});
