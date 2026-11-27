import { describe, expect, it } from "vitest";

import { accentInk, hexToRgb, hsvToRgb, normalizeHex, oklchHueChroma, rgbToHex, rgbToHsv } from "./color";

describe("color", () => {
  it("normalizes hex", () => {
    expect(normalizeHex("C07BC4")).toBe("#c07bc4");
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("#12345")).toBeNull();
  });

  it("round-trips hsv", () => {
    const rgb = hexToRgb("#c07bc4");
    expect(rgbToHex(hsvToRgb(rgbToHsv(rgb)))).toBe("#c07bc4");
  });

  it("picks the accent hue and readable ink", () => {
    const rgb = hexToRgb("#c07bc4");
    expect(Math.round(oklchHueChroma(rgb).hue)).toBe(325);
    expect(accentInk(rgb)).toBe("dark");
    expect(accentInk(hexToRgb("#f5f080"))).toBe("dark");
    expect(accentInk(hexToRgb("#3a2a8a"))).toBe("light");
    // Mid-tones (L* ≈ 50–58) now get white text.
    expect(accentInk(hexToRgb("#8a6bb0"))).toBe("light");
    expect(accentInk(hexToRgb("#4fa3c7"))).toBe("dark");
  });
});
