import { globalStyle, style } from "@vanilla-extract/css";

import {
  mappingTableColumnsNoRemove,
  mappingTableGap,
} from "../mappingTableGrid.css";

export const buttonGrid = style({
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 6,
});

export const buttonHead = style({
  display: "grid",
  gridTemplateColumns: mappingTableColumnsNoRemove,
  gap: mappingTableGap,
  padding: "0 8px 2px 10px",
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
