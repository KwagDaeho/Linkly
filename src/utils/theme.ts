import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
} from "../constants/fontScale";
import { ACCENT_DEFAULT } from "../constants/accent";
import {
  accentInk,
  hexToRgb,
  normalizeHex,
  oklchHueChroma,
  rgbToHex,
} from "../domain/color/color";
import {
  ACCENT_COLOR_KEY,
  FONT_SCALE_KEY,
  LANG_KEY,
  THEME_KEY,
} from "../constants/storage";
import type { Theme, Lang } from "../types";

export const clampFontScale = (value: number): number => {
  const stepped =
    FONT_SCALE_DEFAULT +
    Math.round((value - FONT_SCALE_DEFAULT) / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, stepped));
};

export const applyFontScale = (percent: number) => {
  document.documentElement.style.fontSize = `${clampFontScale(percent)}%`;
};

export const loadFontScale = (): number => {
  const saved = localStorage.getItem(FONT_SCALE_KEY);
  if (saved === null) {
    return FONT_SCALE_DEFAULT;
  }
  const parsed = Number(saved);
  if (!Number.isFinite(parsed)) {
    return FONT_SCALE_DEFAULT;
  }
  return clampFontScale(parsed);
};
export const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};
export const loadTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
export const loadLang = (): Lang => {
  const saved = localStorage.getItem(LANG_KEY);
  return saved === "en" ? "en" : "ko";
};

/** Accent + the neutral tint derived from it (see `styles/theme.css.ts`). */
export const applyAccent = (hex: string) => {
  const rgb = hexToRgb(hex);
  const { hue, chroma } = oklchHueChroma(rgb);
  const style = document.documentElement.style;
  style.setProperty("--accent-color", rgbToHex(rgb));
  style.setProperty("--hue-n", String(Math.round(hue - 10)));
  style.setProperty("--tint", String(Math.min(1, chroma / 0.08).toFixed(3)));
  style.setProperty(
    "--accent-ink-auto",
    accentInk(rgb) === "light" ? "#ffffff" : "var(--ink-on-accent-dark)",
  );
};

export const loadAccent = (): string =>
  normalizeHex(localStorage.getItem(ACCENT_COLOR_KEY) ?? "") ?? ACCENT_DEFAULT;
