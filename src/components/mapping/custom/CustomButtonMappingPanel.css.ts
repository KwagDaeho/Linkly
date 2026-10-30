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
    gridTemplateColumns: mappingTableColumns,
    gap: mappingTableGap,
  },
]);

globalStyle(`${customMappingHead} > span:nth-child(4), ${customMappingHead} > span:nth-child(5)`, {
  textAlign: "left",
  paddingLeft: 1,
});

