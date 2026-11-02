/** Main shell inset from window left/right edges (AppShell, BootScreen). */
export const shellSideInsetPx = 72;

/** Vertical gap between AppShell grid rows (see AppShell.css.ts `shell`). */
export const shellSectionGapPx = 8;

/** Contact footer: space from tab content to top border (excludes shell row gap). */
export const footerSpaceAboveBorderPx = 40;

/** Contact footer: space from top border to footer text. */
export const footerSpaceBelowBorderPx = 48;

/** Contact footer: trailing space below footer block. */
export const footerSpaceBottomPx = 120;

/** Section tab pill, panel track, and label color (keep in sync). */
export const tabTransitionMs = 520;
export const tabTransitionEase = "cubic-bezier(0.4, 0, 0.2, 1)";
/** List reorder (MacroStepList). */
export const listReorderTransition =
  "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
const reorderEase = "cubic-bezier(0.22, 1, 0.36, 1)";
export const tabPillNudgeTransition = `left 260ms ${reorderEase}, top 260ms ${reorderEase}, width 260ms ${reorderEase}, height 260ms ${reorderEase}`;

/** Segmented controls (section tabs, header theme/lang, font scale) — not toggle switches. */
export const chromeSegmentRadiusPx = 8;
export const chromeSegmentPillRadiusPx = 6;
export const chromeSegmentPaddingPx = 3;
/** Scales with root font-size (20px at 100% zoom). */
export const chromeSegmentIconRem = 1.25;
/** Vertical padding per side on header theme/lang segment buttons. */
export const chromeSegmentButtonPadYRem = 0.36;
/** Primary section tab column widths (system, trigger, mouse). */
export const sectionTabColumnWidthsRem = [5.75, 5.5, 5.5] as const;
/** @deprecated use sectionTabColumnWidthsRem */
export const sectionTabColumnWidthRem = 5.5;
export const sectionTabDevicesFontRem = 1.0625;
/** Primary section tab (Info / Link) typography & inset. */
export const sectionTabFontRem = 1;
export const sectionTabPadYRem = 0.72;
export const sectionTabPadXRem = 1.05;
export const tabHoverNudge = 0.045;
/** Stronger horizontal pill nudge for compact header segments. */
export const headerSegmentHoverNudge = 0.12;

/** Horizontal padding inside boxed `Panel` root (see Panel.css.ts). */
export const panelPaddingX = 12;

/** Text inset inside accordion `panelInner` (left of border). */
export const sectionContentPadLeft = 12;

/** Accordion left rail border width — static sections omit border but add this to pad. */
export const accordionRailBorderPx = 1;

/** Match accordion inner content x-position without drawing the rail. */
export const staticSectionPadLeft =
  sectionContentPadLeft + accordionRailBorderPx;
