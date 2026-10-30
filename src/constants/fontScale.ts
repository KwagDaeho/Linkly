export const FONT_SCALE_MIN = 100;
export const FONT_SCALE_MAX = 200;
export const FONT_SCALE_STEP = 10;
export const FONT_SCALE_DEFAULT = 100;

/** Multiply layout px (e.g. Tauri window width) by stored font scale. */
export const scaleLayoutPx = (
  px: number,
  percent: number = FONT_SCALE_DEFAULT,
): number => Math.round(px * (percent / FONT_SCALE_DEFAULT));
