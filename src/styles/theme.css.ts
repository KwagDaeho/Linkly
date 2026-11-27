import { globalStyle } from "@vanilla-extract/css";

import { ACCENT_DEFAULT } from "@/constants/accent";

/**
 * Neutrals are tinted toward the accent's hue (set from JS by `applyAccent`);
 * `--tint` fades the tint out for greyish accents.
 */
const n = (l: number, c: number, alpha?: number) =>
  `oklch(${l} calc(${c} * var(--tint)) var(--hue-n)${alpha === undefined ? "" : ` / ${alpha}`})`;
const a = (alpha?: number) =>
  alpha === undefined
    ? "var(--accent-color)"
    : `color-mix(in srgb, var(--accent-color) ${Math.round(alpha * 100)}%, transparent)`;

globalStyle(":root", {
  vars: {
    "--accent-color": ACCENT_DEFAULT,
    "--hue-n": "315",
    "--tint": "1",
    "--ink-on-accent-dark": "oklch(0.197 0.023 var(--hue-n))",
    "--accent-ink-auto": "var(--ink-on-accent-dark)",
  },
});

globalStyle(":root, [data-theme='light']", {
  vars: {
    "--bg0": n(0.955, 0.012),
    "--bg1": n(0.98, 0.007),
    "--ink": n(0.227, 0.017),
    "--heading-h3": n(0.392, 0.034),
    "--muted": n(0.509, 0.024),
    "--line": n(0.873, 0.028),
    "--line-accent": "color-mix(in srgb, var(--accent) 34%, var(--line))",
    "--panel": "rgba(255, 255, 255, 0.78)",
    "--panel-solid": "#ffffff",
    "--accent": a(),
    "--accent-ink": "var(--accent-ink-auto)",
    "--accent-soft": a(0.16),
    "--interaction-hover-surface":
      "color-mix(in srgb, var(--accent-soft) 55%, transparent)",
    "--interaction-hover-border": "var(--accent)",
    "--interaction-hover-button":
      "color-mix(in srgb, var(--accent) 86%, white)",
    "--chrome-subtle-hover":
      "color-mix(in srgb, var(--muted) 7%, transparent)",
    "--ok": "#2f8a55",
    "--ok-glow": "rgba(47, 138, 85, 0.18)",
    "--warn-bg": n(0.95, 0.035),
    "--warn-ink": n(0.402, 0.076),
    "--probe-bg": n(0.215, 0.019),
    "--probe-fg": n(0.898, 0.039),
    "--shadow": n(0.235, 0.061, 0.12),
    "--backdrop": n(0.171, 0.027),
    "--radius": "10px",
  },
  colorScheme: "light",
});

globalStyle("[data-theme='dark']", {
  vars: {
    "--bg0": n(0.19, 0.013),
    "--bg1": n(0.221, 0.021),
    "--ink": n(0.948, 0.019),
    "--heading-h3": n(0.815, 0.034),
    "--muted": n(0.701, 0.039),
    "--line": n(0.33, 0.032),
    "--line-accent": "color-mix(in srgb, var(--accent) 52%, var(--line))",
    "--panel": n(0.247, 0.024, 0.88),
    "--panel-solid": n(0.27, 0.026),
    "--accent": a(),
    "--accent-ink": "var(--accent-ink-auto)",
    "--accent-soft": a(0.22),
    "--interaction-hover-surface":
      "color-mix(in srgb, var(--accent-soft) 55%, transparent)",
    "--interaction-hover-border": "var(--accent)",
    "--interaction-hover-button":
      "color-mix(in srgb, var(--accent) 86%, white)",
    "--chrome-subtle-hover":
      "color-mix(in srgb, var(--muted) 7%, transparent)",
    "--ok": "#5dcb87",
    "--ok-glow": "rgba(93, 203, 135, 0.2)",
    "--warn-bg": n(0.314, 0.047),
    "--warn-ink": n(0.911, 0.047),
    "--probe-bg": n(0.156, 0.013),
    "--probe-fg": n(0.87, 0.044),
    "--shadow": "rgba(0, 0, 0, 0.45)",
  },
  colorScheme: "dark",
});

globalStyle(":root", {
  fontFamily: '"Avenir Next", "Gill Sans", "Futura", sans-serif',
  color: "var(--ink)",
  background: "var(--bg0)",
  fontSynthesis: "none",
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
});

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("html, body, #root", {
  margin: 0,
  height: "100%",
});

globalStyle("html, body", {
  overflow: "hidden",
  width: "100%",
  background: "var(--bg0)",
  userSelect: "none",
  WebkitUserSelect: "none",
});

globalStyle("#root, #root *", {
  userSelect: "none",
  WebkitUserSelect: "none",
});

globalStyle("button, [role='tab'], .boot-brand, .boot-tag", {
  userSelect: "none",
  WebkitUserSelect: "none",
});

globalStyle(
  '#root input, #root textarea, #root select, #root [contenteditable="true"]',
  {
    userSelect: "text",
    WebkitUserSelect: "text",
  },
);

globalStyle("#root", {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  scrollbarWidth: "none",
  color: "var(--ink)",
  background:
    "radial-gradient(820px 420px at 8% -12%, var(--accent-soft) 0%, transparent 55%), radial-gradient(640px 360px at 100% 0%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 50%), linear-gradient(165deg, var(--bg1), var(--bg0))",
});

globalStyle("#root::-webkit-scrollbar", {
  width: 0,
  height: 0,
  display: "none",
});

globalStyle("button, input, select", {
  font: "inherit",
  color: "inherit",
});

globalStyle("button", {
  // Transparent 1px border: filled and outlined (ghost) buttons share one height.
  border: "1px solid transparent",
  borderRadius: 7,
  padding: "0.38rem 0.85rem",
  background: "var(--accent)",
  color: "var(--accent-ink)",
  fontWeight: 600,
  fontSize: "0.86rem",
  cursor: "pointer",
});

globalStyle("button:disabled", {
  opacity: 0.45,
  cursor: "not-allowed",
});

globalStyle("button:active:not(:disabled):not([data-drag-handle]):not([data-font-scale-btn]):not([data-action-select-trigger]):not([data-action-select-item])", {
  transform: "translateY(1px)",
});

globalStyle("button:hover:not(:disabled):not([data-drag-handle]):not([data-accordion-heading]):not([data-tab-item]):not([data-mapping-trigger]):not([data-header-segment]):not([data-font-scale-btn]):not([data-action-select-trigger]):not([data-action-select-item])", {
  background: "var(--interaction-hover-button)",
});

globalStyle("select, input[type='number']", {
  width: "100%",
  borderRadius: 7,
  border: "1px solid var(--line)",
  background: "var(--panel-solid)",
  padding: "0.32rem 0.55rem",
  color: "var(--ink)",
  fontSize: "0.84rem",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
});

globalStyle("select", {
  appearance: "none",
  WebkitAppearance: "none",
  paddingRight: "1.8rem",
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--accent) 50%), linear-gradient(135deg, var(--accent) 50%, transparent 50%)",
  backgroundPosition:
    "calc(100% - 12px) calc(50% - 2px), calc(100% - 7px) calc(50% - 2px)",
  backgroundSize: "5px 5px, 5px 5px",
  backgroundRepeat: "no-repeat",
  cursor: "pointer",
});

globalStyle("select:hover:not(:disabled)", {
  borderColor: "var(--interaction-hover-border)",
});

globalStyle("input[type='number']:hover:not(:disabled)", {
  borderColor: "var(--interaction-hover-border)",
});

globalStyle("select:disabled", {
  opacity: 0.45,
  cursor: "not-allowed",
  borderColor: "var(--line)",
  boxShadow: "none",
});

globalStyle("select:focus, input[type='number']:focus", {
  outline: "none",
  borderColor: "var(--interaction-hover-border)",
  boxShadow: "0 0 0 3px var(--accent-soft)",
});

const rangeThumbSize = "0.875rem";
const rangeThumbBorder = "2px solid var(--line)";
const rangeTrackHeight = "4px";

globalStyle("input[type='range']", {
  width: "100%",
  height: "1.35rem",
  margin: 0,
  padding: 0,
  appearance: "none",
  WebkitAppearance: "none",
  background: "transparent",
  cursor: "pointer",
});

globalStyle("input[type='range']:disabled", {
  opacity: 0.45,
  cursor: "not-allowed",
});

globalStyle("input[type='range']::-webkit-slider-runnable-track", {
  height: rangeTrackHeight,
  borderRadius: 999,
  background: "color-mix(in srgb, var(--muted) 32%, transparent)",
});

globalStyle("input[type='range']::-webkit-slider-thumb", {
  appearance: "none",
  WebkitAppearance: "none",
  width: rangeThumbSize,
  height: rangeThumbSize,
  marginTop: `calc((${rangeTrackHeight} - ${rangeThumbSize}) / 2)`,
  borderRadius: "50%",
  border: rangeThumbBorder,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  transition:
    "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
});

globalStyle("input[type='range']:hover:not(:disabled)::-webkit-slider-thumb", {
  borderColor: "var(--interaction-hover-border)",
});

globalStyle(
  "input[type='range']:active:not(:disabled)::-webkit-slider-thumb",
  {
    background: "var(--interaction-hover-border)",
    borderColor: "var(--interaction-hover-border)",
  },
);

globalStyle("input[type='range']::-moz-range-track", {
  height: rangeTrackHeight,
  borderRadius: 999,
  background: "color-mix(in srgb, var(--muted) 32%, transparent)",
  border: 0,
});

globalStyle("input[type='range']::-moz-range-thumb", {
  width: rangeThumbSize,
  height: rangeThumbSize,
  borderRadius: "50%",
  border: rangeThumbBorder,
  background: "#fff",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
  transition:
    "border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
});

globalStyle("input[type='range']:hover:not(:disabled)::-moz-range-thumb", {
  borderColor: "var(--interaction-hover-border)",
});

globalStyle("input[type='range']:active:not(:disabled)::-moz-range-thumb", {
  background: "var(--interaction-hover-border)",
  borderColor: "var(--interaction-hover-border)",
});
