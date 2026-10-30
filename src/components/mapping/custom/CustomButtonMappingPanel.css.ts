import { style } from "@vanilla-extract/css";

import { buttonHead } from "../button/ButtonMappingPanel.css";

export const toolbarRow = style({
  justifyContent: "flex-end",
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
