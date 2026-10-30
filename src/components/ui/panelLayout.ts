/** Main shell inset from window left/right edges (AppShell, BootScreen). */
export const shellSideInsetPx = 72;

/** Horizontal padding inside boxed `Panel` root (see Panel.css.ts). */
export const panelPaddingX = 12;

/** Text inset inside accordion `panelInner` (left of border). */
export const sectionContentPadLeft = 12;

/** Accordion left rail border width — static sections omit border but add this to pad. */
export const accordionRailBorderPx = 1;

/** Match accordion inner content x-position without drawing the rail. */
export const staticSectionPadLeft =
  sectionContentPadLeft + accordionRailBorderPx;
