import { globalStyle, style } from "@vanilla-extract/css";

import * as overlayScrollArea from "../../layout/OverlayScrollArea.css";

export const root = style({
  position: "relative",
  minWidth: 0,
  width: "100%",
  selectors: {
    '&[data-open="true"]': {
      zIndex: 100,
    },
  },
});

export const trigger = style({
  all: "unset",
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  width: "100%",
  minWidth: 0,
  margin: 0,
  minHeight: "unset",
  padding: "0.32rem 0.55rem",
  paddingRight: "1.75rem",
  border: "1px solid var(--line)",
  borderRadius: 7,
  background: "var(--panel-solid)",
  color: "var(--ink)",
  fontSize: "0.84rem",
  fontWeight: 500,
  lineHeight: 1.25,
  textAlign: "left",
  cursor: "pointer",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  selectors: {
    "&:hover:not(:disabled)": {
      borderColor: "var(--interaction-hover-border)",
      background: "var(--panel-solid)",
    },
    "&:disabled": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
    '&[aria-expanded="true"]': {
      borderColor: "var(--interaction-hover-border)",
      boxShadow: "0 0 0 3px var(--accent-soft)",
    },
  },
});

export const triggerLabel = style({
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const chevron = style({
  position: "absolute",
  right: "0.55rem",
  top: "50%",
  transform: "translateY(-50%)",
  flexShrink: 0,
  opacity: 0.75,
  fontSize: "0.65rem",
  color: "var(--accent)",
  pointerEvents: "none",
});

export const menu = style({
  position: "fixed",
  zIndex: 9000,
  display: "grid",
  alignItems: "stretch",
  boxSizing: "border-box",
  minHeight: 0,
  border: "1px solid var(--line)",
  borderRadius: "0.5rem",
  background: "var(--panel-solid)",
  color: "var(--ink)",
  boxShadow: "0 12px 40px var(--shadow)",
  isolation: "isolate",
  overflow: "hidden",
});

const paneHost = style({
  minHeight: 0,
  minWidth: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--panel-solid)",
});

export const paneViewport = style({
  flex: "1 1 0",
  minHeight: 0,
  minWidth: 0,
  height: "100%",
  maxHeight: "100%",
  overscrollBehavior: "contain",
});

export const categoryPane = style([
  paneHost,
  {
    borderRight: "1px solid var(--line)",
  },
]);

export const subcategoryPane = style([
  paneHost,
  {
    borderRight: "1px solid var(--line)",
  },
]);

export const entryPane = style([paneHost]);

/** Second column when there is no subcategory pane (category → entries). */
export const entryPaneTwoCol = style([paneHost]);

globalStyle(`${paneHost} ${overlayScrollArea.root}`, {
  flex: "1 1 0",
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

globalStyle(`${paneHost} ${overlayScrollArea.viewport}`, {
  flex: "1 1 0",
  minHeight: 0,
  height: "100%",
  maxHeight: "100%",
});

export const menuRow = style({
  all: "unset",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  minHeight: "2rem",
  margin: 0,
  padding: "0.375rem 0.625rem",
  border: "none",
  borderRadius: 0,
  background: "var(--panel-solid)",
  color: "var(--ink)",
  fontSize: "0.8125rem",
  fontWeight: 500,
  lineHeight: 1.25,
  textAlign: "left",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

export const menuRowLabel = style({
  flex: "1 1 auto",
  minWidth: 0,
  pointerEvents: "none",
});

export const categoryRow = style([
  menuRow,
  {
    selectors: {
      "&:hover:not(:disabled)": {
        background: "var(--accent-soft)",
      },
    },
  },
]);

export const categoryRowActive = style({
  background: "var(--accent-soft)",
  color: "var(--accent)",
});

export const entryRow = style([
  menuRow,
  {
    selectors: {
      "&:hover:not(:disabled)": {
        background: "var(--accent-soft)",
      },
    },
  },
]);

export const entryRowSelected = style({
  background: "var(--accent-soft)",
});

export const rowChevron = style({
  marginLeft: "auto",
  flexShrink: 0,
  opacity: 0.45,
  fontSize: "0.7rem",
  pointerEvents: "none",
});

export const radio = style({
  flexShrink: 0,
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "1.5px solid var(--line-strong, var(--line))",
  boxSizing: "border-box",
  pointerEvents: "none",
});

export const radioOn = style({
  borderColor: "var(--accent)",
  boxShadow: "inset 0 0 0 3px var(--accent)",
});

globalStyle(`${root}[data-disabled="true"] ${trigger}`, {
  opacity: 0.45,
  cursor: "not-allowed",
});
