import { globalStyle, style } from "@vanilla-extract/css";

export const ghost = style({
  background: "transparent",
  color: "var(--ink)",
  border: "1px solid var(--line)",
  transition:
    "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
});

globalStyle(`${ghost}:hover:not(:disabled)`, {
  background: "var(--interaction-hover-surface)",
  borderColor: "var(--interaction-hover-border)",
});

export const remove = style({
  background: "transparent",
  color: "var(--muted)",
  border: "none",
  transition: "background 0.15s ease, color 0.15s ease",
});

globalStyle(`${remove}:hover:not(:disabled)`, {
  background: "var(--interaction-hover-button)",
  color: "#1a121c",
});

export const tiny = style({
  padding: "0.18rem 0.45rem",
  fontSize: "0.74rem",
});
