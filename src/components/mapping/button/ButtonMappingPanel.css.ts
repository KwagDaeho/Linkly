import { globalStyle, style } from "@vanilla-extract/css";

import {
  mappingTableColumnsNoRemove,
  mappingTableGap,
} from "../mappingTableGrid.css";

export const buttonGrid = style({
  marginTop: 0,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0.375rem",
});

export const buttonHead = style({
  display: "grid",
  gridTemplateColumns: mappingTableColumnsNoRemove,
  gap: mappingTableGap,
  padding: "0 0.5rem 0.125rem 0.625rem",
  color: "var(--muted)",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.03em",
  alignItems: "end",
});

globalStyle(`${buttonHead} > span`, {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

globalStyle(`${buttonHead} > span:nth-child(4), ${buttonHead} > span:nth-child(5)`, {
  textAlign: "left",
  paddingLeft: 1,
});
