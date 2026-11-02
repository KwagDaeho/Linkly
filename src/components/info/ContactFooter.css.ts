import { globalStyle, style } from "@vanilla-extract/css";

import {
  footerSpaceBelowBorderPx,
  footerSpaceBottomPx,
} from "@/components/ui/panelLayout";

export const footer = style({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 24,
  color: "var(--muted)",
  fontSize: "0.86rem",
  boxSizing: "border-box",
  paddingTop: footerSpaceBelowBorderPx,
  paddingRight: 4,
  paddingBottom: 10,
  paddingLeft: 4,
  borderTop: "1px solid var(--line)",
  marginTop: 0,
  marginBottom: footerSpaceBottomPx,
});

export const footerEmbedded = style({
  marginBottom: 0,
  paddingTop: 0,
  borderTop: "none",
});

export const footerMain = style({
  display: "grid",
  gap: 6,
  flex: "1 1 auto",
  minWidth: 0,
});

/** Smaller than header hero mark — app info block only. */
export const footerBrandMark = style({
  margin: 0,
  fontFamily: '"Futura", "Avenir Next", "Gill Sans", sans-serif',
  fontWeight: 700,
  fontSize: "2.75rem",
  lineHeight: 1.1,
  letterSpacing: "-0.09em",
  color: "var(--accent)",
  userSelect: "none",
  WebkitUserSelect: "none",
});

/** Right column — bottom edge lines up with last contact row. */
export const footerBrand = style({
  flexShrink: 0,
  alignSelf: "flex-end",
});

export const credit = style({
  margin: 0,
  color: "var(--ink)",
  fontWeight: 600,
  fontSize: "0.98rem",
  lineHeight: 1.4,
});

export const creditBy = style({
  color: "var(--muted)",
  fontWeight: 500,
});

export const contactBlock = style({
  display: "grid",
  gap: 5,
  marginTop: 16,
});

globalStyle(`${contactBlock} strong`, {
  color: "var(--ink)",
  fontSize: "0.94rem",
});

globalStyle(`${contactBlock} p`, {
  margin: 0,
});

globalStyle(`${footer} a`, {
  color: "var(--accent)",
  fontWeight: 600,
  textDecoration: "none",
});

globalStyle(`${footer} a:hover`, {
  color: "var(--interaction-hover-border)",
  textDecoration: "underline",
});
