import { style } from "@vanilla-extract/css";

export const host = style({
  position: "fixed",
  left: "50%",
  bottom: 28,
  transform: "translateX(-50%)",
  zIndex: 10000,
  pointerEvents: "none",
  maxWidth: "min(22rem, calc(100vw - 32px))",
});

export const toast = style({
  margin: 0,
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--panel-solid)",
  color: "var(--ink)",
  fontSize: "0.88rem",
  fontWeight: 600,
  lineHeight: 1.35,
  textAlign: "center",
  boxShadow: "0 8px 28px rgba(0, 0, 0, 0.22)",
});
