import { globalStyle, style } from "@vanilla-extract/css";

export const root = style({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  width: "fit-content",
  maxWidth: "100%",
  fontWeight: 600,
  fontSize: "0.86rem",
  cursor: "pointer",
  userSelect: "none",
  lineHeight: 1,
  margin: 0,
});

export const inline = style({
  width: "fit-content",
  maxWidth: "100%",
  gap: 8,
  minHeight: "0.875rem",
});

/** Label column, then switch (settings list rows). */
export const labelFirst = style({
  display: "grid",
  width: "100%",
  gridTemplateColumns: "minmax(9.375rem, 1fr) max-content",
  columnGap: "0.75rem",
  alignItems: "center",
  minHeight: "0.875rem",
  fontSize: "0.92rem",
  fontWeight: 600,
});

export const labelFirstTitle = style({
  margin: 0,
  padding: 0,
  minWidth: 0,
});

export const flag = style({
  justifyContent: "flex-start",
  gap: 0,
  width: "fit-content",
});

globalStyle(`${flag} input[type="checkbox"]:disabled`, {
  opacity: 0.35,
  cursor: "not-allowed",
});

export const title = style({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "0.875rem",
  lineHeight: 1.35,
  margin: 0,
  padding: 0,
  flex: "0 1 auto",
  minWidth: 0,
});

export const description = style({
  display: "inline-flex",
  alignItems: "center",
  height: "0.875rem",
  lineHeight: 1,
  margin: 0,
  padding: 0,
  minWidth: 0,
  color: "var(--muted)",
  fontSize: "0.78rem",
  fontWeight: 400,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

globalStyle(`${labelFirst} input[type="checkbox"]`, {
  gridColumn: 2,
  gridRow: 1,
});

globalStyle(`${root} input[type="checkbox"]`, {
  appearance: "none",
  WebkitAppearance: "none",
  width: "1.75rem",
  height: "0.875rem",
  margin: 0,
  padding: 0,
  flexShrink: 0,
  border: 0,
  borderRadius: 999,
  background: "color-mix(in srgb, var(--muted) 38%, transparent)",
  position: "relative",
  display: "inline-block",
  verticalAlign: "middle",
  cursor: "pointer",
  boxShadow: "none",
  overflow: "hidden",
  transition: "background 0.15s ease",
});

globalStyle(`${root} input[type="checkbox"]::after`, {
  content: '""',
  position: "absolute",
  top: "0.125rem",
  left: "0.125rem",
  width: "0.625rem",
  height: "0.625rem",
  borderRadius: "50%",
  background: "#fff",
  boxShadow: "0 1px 1px rgba(0, 0, 0, 0.18)",
  transition: "transform 0.15s ease",
});

globalStyle(`${root} input[type="checkbox"]:checked`, {
  background: "var(--accent)",
  boxShadow: "none",
});

globalStyle(`${root} input[type="checkbox"]:checked::after`, {
  transform: "translateX(0.875rem)",
});

globalStyle(`${root} input[type="checkbox"]:focus-visible`, {
  outline: "0.125rem solid color-mix(in srgb, var(--accent) 55%, transparent)",
  outlineOffset: "0.125rem",
  boxShadow: "none",
});
