import { globalStyle, style } from "@vanilla-extract/css";

import {
  mappingTableColumns,
  mappingTableGap,
} from "../mappingTableGrid.css";

export const row = style({
  display: "grid",
  gridTemplateColumns: mappingTableColumns,
  alignItems: "center",
  gap: mappingTableGap,
  minHeight: 32,
  padding: "3px 8px 3px 10px",
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--accent-soft)",
});

export const comboTrigger = style({
  justifySelf: "start",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const remove = style({
  justifySelf: "end",
});

globalStyle(`${row} select`, {
  minWidth: 0,
  width: "100%",
});

globalStyle(`${row} select:disabled`, {
  opacity: 0.45,
  cursor: "not-allowed",
});

globalStyle(`${row} > *:nth-child(4), ${row} > *:nth-child(5)`, {
  justifySelf: "start",
});

globalStyle(`${row} > *:nth-child(6)`, {
  marginLeft: -14,
});
