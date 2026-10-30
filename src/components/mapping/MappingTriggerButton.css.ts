import { globalStyle, style } from "@vanilla-extract/css";

import { pill, pillCompact } from "@/components/ui/KeyChordPills.css";

export const unsetChip = style({
  display: "inline-flex",
  alignItems: "center",
  padding: "0.22rem 0.5rem",
  borderRadius: "0.4375rem",
  border: "1px dashed var(--line)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: "0.8rem",
  fontWeight: 650,
  lineHeight: 1.15,
  transition:
    "border-color 0.15s ease, background 0.15s ease, color 0.15s ease",
});

/** Transparent hit target — pills keep accent styling; no panel/chip wrapper. */
export const trigger = style({
  all: "unset",
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
  cursor: "pointer",
  textAlign: "left",
  lineHeight: 1.15,
  borderRadius: "0.4375rem",
});

globalStyle(`${trigger}:hover:not(:disabled) ${unsetChip}`, {
  borderColor: "var(--interaction-hover-border)",
  borderStyle: "solid",
  background: "var(--interaction-hover-button)",
  color: "var(--accent-ink)",
});

globalStyle(
  `${trigger}:hover:not(:disabled) ${pill}, ${trigger}:hover:not(:disabled) ${pillCompact}`,
  {
    background: "var(--interaction-hover-button)",
  },
);
