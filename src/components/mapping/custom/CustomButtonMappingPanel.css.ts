import { globalStyle, style } from "@vanilla-extract/css";

import { buttonHead } from "../button/ButtonMappingPanel.css";
import {
  mappingTableGap,
  reorderTableColumns,
} from "../mappingTableGrid.css";

export const toolbar = style({
  marginTop: 0,
  marginBottom: 10,
});

/** Fixed box (border-box) so filled and outlined variants line up exactly. */
const addButtonBox = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  minWidth: "7.5rem",
  height: "1.9rem",
  padding: "0 1.35rem",
  fontSize: "0.86rem",
  lineHeight: 1,
} as const;

export const addButton = style(addButtonBox);

export const empty = style({
  margin: "8px 0 0",
});

export const customMappingHead = style([
  buttonHead,
  {
    gridTemplateColumns: reorderTableColumns,
    gap: mappingTableGap,
    paddingLeft: "0.3rem",
  },
]);

globalStyle(`${customMappingHead} > span:nth-child(5), ${customMappingHead} > span:nth-child(6)`, {
  textAlign: "left",
  paddingLeft: 1,
});

