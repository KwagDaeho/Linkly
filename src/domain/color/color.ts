/** Small sRGB / HSV / OKLCH helpers for the accent color. */

export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };

const clamp255 = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

/** `#abc` / `abc` / `#aabbcc` → `#aabbcc`, or null. */
export const normalizeHex = (raw: string): string | null => {
  const hex = raw.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return `#${hex.split("").map((c) => c + c).join("")}`;
  }
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
};

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt((normalizeHex(hex) ?? "#000000").slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
};

export const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((c) => clamp255(c).toString(16).padStart(2, "0")).join("")}`;

export const rgbToInt = ({ r, g, b }: Rgb): number =>
  (clamp255(r) << 16) | (clamp255(g) << 8) | clamp255(b);

export const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const d = max - Math.min(rr, gg, bb);
  let h = 0;
  if (d > 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
};

export const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return { r: clamp255(f(5)), g: clamp255(f(3)), b: clamp255(f(1)) };
};

const linear = (c: number) => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance. */
export const luminance = ({ r, g, b }: Rgb): number =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** OKLCH hue (degrees) and chroma. */
export const oklchHueChroma = ({ r, g, b }: Rgb): { hue: number; chroma: number } => {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    hue: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
    chroma: Math.hypot(a, bb),
  };
};

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Text on the accent: dark on bright accents, white on deep ones (whichever reads better). */
export const accentInk = (rgb: Rgb): "light" | "dark" => {
  const lum = luminance(rgb);
  return contrast(lum, 1) > contrast(lum, 0.008) ? "light" : "dark";
};
