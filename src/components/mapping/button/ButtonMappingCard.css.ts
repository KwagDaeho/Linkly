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
  minHeight: "2rem",
  padding: "0.1875rem 0.5rem 0.1875rem 0.625rem",
  border: "1px solid var(--line)",
  borderRadius: "0.5rem",
  background: "var(--accent-soft)",
});

globalStyle(`${card} [data-action-select], ${card} select`, {
  minWidth: 0,
  width: "100%",
});

globalStyle(`${card} [data-action-select][data-disabled="true"], ${card} select:disabled`, {
  opacity: 0.45,
  cursor: "not-allowed",
});

globalStyle(`${card} > *:nth-child(4), ${card} > *:nth-child(5)`, {
  justifySelf: "start",
});

globalStyle(`${card} > *:nth-child(6)`, {
  marginLeft: "-0.875rem",
});
