import { globalStyle, style } from "@vanilla-extract/css";

import {
  mappingTableColumnsNoRemove,
  mappingTableGap,
} from "../mappingTableGrid.css";

export const card = style({
  display: "grid",
  gridTemplateColumns: mappingTableColumnsNoRemove,
  alignItems: "center",
  gap: mappingTableGap,
  minHeight: 32,
  padding: "3px 8px 3px 10px",
  border: "1px solid var(--line)",
  borderRadius: 8,
  background: "var(--accent-soft)",
});

globalStyle(`${card} select`, {
  minWidth: 0,
  width: "100%",
});

globalStyle(`${card} select:disabled`, {
  opacity: 0.45,
  cursor: "not-allowed",
});

globalStyle(`${card} > *:nth-child(4), ${card} > *:nth-child(5)`, {
  justifySelf: "start",
});

globalStyle(`${card} > *:nth-child(6)`, {
  marginLeft: -14,
});
