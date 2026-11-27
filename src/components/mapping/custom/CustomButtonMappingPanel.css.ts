import { globalStyle, style } from "@vanilla-extract/css";

import { buttonHead } from "../button/ButtonMappingPanel.css";
import {
  mappingTableColumns,
  mappingTableGap,
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

/** Bordered (ghost) twin of `addButton`: same outer size. */
export const addButtonOutlined = style(addButtonBox);

export const empty = style({
  margin: "8px 0 0",
});

export const customMappingHead = style([
  buttonHead,
  {
    gridTemplateColumns: mappingTableColumns,
    gap: mappingTableGap,
  },
]);

globalStyle(`${customMappingHead} > span:nth-child(4), ${customMappingHead} > span:nth-child(5)`, {
  textAlign: "left",
  paddingLeft: 1,
});

