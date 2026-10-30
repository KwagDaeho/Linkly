import { globalStyle, style } from "@vanilla-extract/css";

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
  borderRadius: 999,
  overflow: "hidden",
  background: "var(--panel)",
  flexShrink: 0,
} as const;

/** Theme / language — rem (scales with app font-size). */
const chromePill = {
  display: "inline-flex",
  alignItems: "stretch",
  border: "1px solid var(--line)",
  borderRadius: 999,
  overflow: "hidden",
  background: "var(--panel)",
  flexShrink: 0,
} as const;

const chromeButton = {
  border: 0,
  borderRadius: 0,
  background: "transparent",
  color: "var(--muted)",
  padding: "0.22rem 0.55rem",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.04em",
  display: "inline-grid",
  placeItems: "center",
  minWidth: "1.9rem",
  minHeight: "1.55rem",
  boxSizing: "border-box",
  cursor: "pointer",
} as const;

export const hero = style({
  padding: "4px 2px 0",
  marginBottom: "1.85rem",
});

/** px/vw — not scaled with app font-size preference */
export const title = style({
  margin: 0,
  fontFamily: '"Futura", "Avenir Next", "Gill Sans", sans-serif',
  fontWeight: 700,
  fontSize: "clamp(38px, 6vw, 58px)",
  lineHeight: 0.92,
  letterSpacing: "-0.04em",
  color: "var(--accent)",
});

export const heroTop = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
});

export const toolbarStack = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 12,
  flexShrink: 0,
});

export const toolbarRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
});

export const themeToggle = style(chromePill);

export const langSwitch = style(chromePill);

export const langButton = style(chromeButton);

export const langButtonActive = style({
  background: "var(--accent)",
  color: "var(--accent-ink)",
});

export const themeButton = style(chromeButton);

globalStyle(`${themeButton} svg`, {
  width: 14,
  height: 14,
  display: "block",
});

export const themeButtonActive = style({
  background: "var(--accent)",
  color: "var(--accent-ink)",
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
