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
  minHeight: "2rem",
  padding: "0.1875rem 0.5rem 0.1875rem 0.625rem",
  border: "1px solid var(--line)",
  borderRadius: "0.5rem",
  background: "var(--accent-soft)",
});

export const comboTrigger = style({
  justifySelf: "start",
  maxWidth: "100%",
  overflow: "hidden",
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
  marginLeft: "-0.875rem",
});
