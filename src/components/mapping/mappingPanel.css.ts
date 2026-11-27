import { globalStyle, style } from "@vanilla-extract/css";

import { mappingTableGap, reorderTableColumns } from "./mappingTableGrid.css";

export const toolbar = style({
  marginTop: 0,
  marginBottom: 10,
});

/** Fixed box (border-box) so filled and outlined variants line up exactly. */
export const addButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  minWidth: "7.5rem",
  height: "1.9rem",
  padding: "0 1.35rem",
  fontSize: "0.86rem",
  lineHeight: 1,
});

export const empty = style({
  margin: "8px 0 0",
});

/** Table head + rows. */
export const table = style({
  marginTop: 0,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0.375rem",
});

/** Trigger rows under the table head. */
export const tableRows = style({
  display: "grid",
  gap: "0.375rem",
});

export const tableHead = style({
  display: "grid",
  gridTemplateColumns: reorderTableColumns,
  gap: mappingTableGap,
  padding: "0 0.5rem 0.125rem 0.3rem",
  color: "var(--muted)",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.03em",
  alignItems: "end",
});

globalStyle(`${tableHead} > span`, {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

globalStyle(
  `${tableHead} > span:nth-child(4), ${tableHead} > span:nth-child(5), ${tableHead} > span:nth-child(6)`,
  {
    textAlign: "left",
    paddingLeft: 1,
  },
);
