import { useEffect, useRef, useState, type PointerEvent } from "react";

import { ACCENT_DEFAULT, ACCENT_RECOMMENDED } from "@/constants/accent";
import {
  hexToRgb,
  hsvToRgb,
  normalizeHex,
  rgbToHex,
  rgbToHsv,
  type Hsv,
  type Rgb,
} from "@/domain/color/color";
import { IconButton } from "@/components/ui";
import { usePrefs } from "@/hooks";
import { useDismiss } from "@/hooks/useDismiss";

import * as styles from "./AccentColorPicker.css";

/** Hue around, saturation outward, at the given brightness. */
const paintWheel = (canvas: HTMLCanvasElement, value: number) => {
  const dpr = window.devicePixelRatio || 1;
  const px = Math.round(canvas.clientWidth * dpr);
  if (px === 0) {
    return;
  }
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return;
  }
  const image = ctx.createImageData(px, px);
  const radius = px / 2;
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      const dist = Math.hypot(dx, dy) / radius;
      if (dist > 1) {
        continue;
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const { r, g, b } = hsvToRgb({ h: hue, s: dist, v: value });
      const i = (y * px + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      // Soft edge.
      image.data[i + 3] = Math.round(Math.min(1, (1 - dist) * radius) * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
};

export const AccentColorPicker = () => {
  const { accentColor, setAccentColor, fontScale, i18n } = usePrefs();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLCanvasElement>(null);
  // Local HSV keeps hue/saturation while brightness is 0 or saturation is 0.
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(accentColor)));
  const [hexDraft, setHexDraft] = useState(accentColor);
  const dragging = useRef(false);

  useEffect(() => {
    if (rgbToHex(hsvToRgb(hsv)) !== accentColor) {
      setHsv(rgbToHsv(hexToRgb(accentColor)));
    }
    setHexDraft(accentColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accentColor]);

  useEffect(() => {
    if (open && wheelRef.current !== null) {
      paintWheel(wheelRef.current, hsv.v);
    }
  }, [open, hsv.v, fontScale]);

  useDismiss([rootRef], () => setOpen(false), open);

  const commitHsv = (next: Hsv) => {
    setHsv(next);
    setAccentColor(rgbToHex(hsvToRgb(next)));
  };

  const pickAt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = event.clientX - rect.left - radius;
    const dy = event.clientY - rect.top - radius;
    commitHsv({
      h: ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360,
      s: Math.min(1, Math.hypot(dx, dy) / radius),
      v: hsv.v === 0 ? 1 : hsv.v,
    });
  };

  const rgb = hexToRgb(accentColor);
  const setChannel = (key: keyof Rgb, raw: string) => {
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value)) {
      return;
    }
    setAccentColor(rgbToHex({ ...rgb, [key]: Math.min(255, Math.max(0, value)) }));
  };

  const angle = (hsv.h * Math.PI) / 180;
  const markerLeft = `${50 + Math.cos(angle) * hsv.s * 50}%`;
  const markerTop = `${50 + Math.sin(angle) * hsv.s * 50}%`;
  const fullColor = rgbToHex(hsvToRgb({ ...hsv, v: 1 }));

  return (
    <div ref={rootRef} className={styles.root}>
      <IconButton
        data-own-hover="press"
        className={styles.trigger}
        label={i18n.accentColor}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.triggerIcon} />
      </IconButton>
      {open && (
        <div className={styles.popover} role="dialog" aria-label={i18n.accentColor}>
          <div className={styles.head}>
            <span>{i18n.accentColor}</span>
            <button
              type="button"
              data-own-hover="press"
              className={styles.reset}
              disabled={accentColor === ACCENT_DEFAULT}
              onClick={() => setAccentColor(ACCENT_DEFAULT)}
            >
              {i18n.accentColorReset}
            </button>
          </div>
          <div
            className={styles.wheelWrap}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              dragging.current = true;
              pickAt(event);
            }}
            onPointerMove={(event) => dragging.current && pickAt(event)}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
          >
            <canvas ref={wheelRef} className={styles.wheel} />
            <span
              className={styles.marker}
              style={{ left: markerLeft, top: markerTop, background: accentColor }}
            />
          </div>
          <input
            type="range"
            className={styles.brightness}
            style={{ ["--wheel-full" as string]: fullColor }}
            min={0}
            max={100}
            step={1}
            value={Math.round(hsv.v * 100)}
            aria-label={i18n.accentBrightness}
            title={i18n.accentBrightness}
            onChange={(e) => commitHsv({ ...hsv, v: Number(e.currentTarget.value) / 100 })}
          />
          <div className={styles.inputs}>
            <label className={styles.field}>
              HEX
              <input
                className={styles.fieldInput}
                value={hexDraft}
                spellCheck={false}
                maxLength={7}
                onChange={(e) => {
                  setHexDraft(e.currentTarget.value);
                  const hex = normalizeHex(e.currentTarget.value);
                  if (hex !== null && e.currentTarget.value.replace("#", "").length === 6) {
                    setAccentColor(hex);
                  }
                }}
                onBlur={() => setHexDraft(accentColor)}
              />
            </label>
            {(["r", "g", "b"] as const).map((key) => (
              <label key={key} className={styles.field}>
                {key.toUpperCase()}
                <input
                  type="number"
                  className={styles.fieldInput}
                  min={0}
                  max={255}
                  value={rgb[key]}
                  onChange={(e) => setChannel(key, e.currentTarget.value)}
                />
              </label>
            ))}
          </div>
          <div className={styles.sectionLabel}>{i18n.accentRecommended}</div>
          <div className={styles.swatches}>
            {ACCENT_RECOMMENDED.map((color) => (
              <button
                key={color}
                type="button"
                className={styles.swatch}
                style={{ background: color }}
                aria-label={color === ACCENT_DEFAULT ? `${color} (${i18n.accentColorReset})` : color}
                title={color === ACCENT_DEFAULT ? `${color} · ${i18n.accentColorReset}` : color}
                aria-pressed={accentColor === color}
                onClick={() => setAccentColor(color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
