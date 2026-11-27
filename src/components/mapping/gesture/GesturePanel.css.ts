import { globalStyle, style } from "@vanilla-extract/css";

export const keys = style({
  marginBottom: 14,
});

/** Gesture rows/head: handle · shape · action · remove (other columns of the trigger table unused). */
const gestureTracks = "1.1rem minmax(7.5rem, 10.5rem) minmax(0, 1fr) 3.5rem";

export const gestureColumns = style({});

// Doubled class: wins over the shared row/head tracks regardless of CSS order.
globalStyle(`${gestureColumns}${gestureColumns}`, {
  gridTemplateColumns: gestureTracks,
});

// The shared row aligns columns 4–6 for the flag cells; here column 4 is "remove".
globalStyle(`${gestureColumns} > *:nth-child(4)`, {
  justifySelf: "end",
  marginLeft: 0,
});

export const shapePill = style({
  padding: "0.15rem 0.45rem",
});

export const thumb = style({
  display: "block",
  width: "2.4rem",
  height: "1.55rem",
});

export const drawHint = style({
  margin: "0 0 10px",
  fontSize: "0.82rem",
  lineHeight: 1.4,
  whiteSpace: "pre-line",
});

export const canvas = style({
  display: "block",
  width: "100%",
  aspectRatio: "440 / 260",
  boxSizing: "border-box",
  border: "1px dashed var(--line-accent)",
  borderRadius: 10,
  background: "var(--panel-solid)",
  touchAction: "none",
});

export const description = style({
  margin: "0 0 14px",
  whiteSpace: "pre-line",
  fontSize: "0.84rem",
  lineHeight: 1.5,
});
