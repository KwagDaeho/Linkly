import { style } from "@vanilla-extract/css";

import { buttonHead } from "../button/ButtonMappingPanel.css";

export const toolbar = style({
  marginTop: 8,
  marginBottom: 10,
});

export const addButton = style({
  minWidth: "7.5rem",
  padding: "0.42rem 1.35rem",
  fontSize: "0.86rem",
});

export const empty = style({
  margin: "8px 0 0",
});

export const customMappingHead = style([
  buttonHead,
  {
    gridTemplateColumns:
      "minmax(7.5rem, 10.5rem) 5.5rem 7rem minmax(0, 1fr) minmax(0, 1fr) 3.5rem",
  },
]);
