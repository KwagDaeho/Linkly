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
  // The global button hover fills with the accent; keep text readable on it.
  color: "var(--accent-ink)",
});

export const remove = style({
  background: "transparent",
  color: "var(--muted)",
  border: "none",
  transition: "background 0.15s ease, color 0.15s ease",
});

globalStyle(`${remove}:hover:not(:disabled)`, {
  background: "var(--interaction-hover-button)",
  color: "var(--accent-ink)",
});

export const tiny = style({
  padding: "0.18rem 0.45rem",
  fontSize: "0.74rem",
});
