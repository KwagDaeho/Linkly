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

/** Horizontal padding inside boxed `Panel` root (see Panel.css.ts). */
export const panelPaddingX = 12;

/** Text inset inside accordion `panelInner` (left of border). */
export const sectionContentPadLeft = 12;

/** Accordion left rail border width — static sections omit border but add this to pad. */
export const accordionRailBorderPx = 1;

/** Match accordion inner content x-position without drawing the rail. */
export const staticSectionPadLeft =
  sectionContentPadLeft + accordionRailBorderPx;
