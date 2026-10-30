import { style } from "@vanilla-extract/css";

/** Reserve space for 「입력 시작」 / 「다시 입력」 while listening. */
export const actionRow = style({
  marginTop: 4,
  minHeight: "2.35rem",
  alignItems: "center",
});

export const savePlaceholder = style({
  visibility: "hidden",
  pointerEvents: "none",
});
