import type { GesturePoint } from "@/types/profile/gesture";

export const pathLength = (points: GesturePoint[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
};

/** Strokes shorter than this (px) are not gestures (matches the Rust recognizer). */
export const MIN_GESTURE_LENGTH = 40;

/** Uniformly scale and centre `points` into a `width`×`height` box with `pad` margin. */
export const fitPoints = (
  points: GesturePoint[],
  width: number,
  height: number,
  pad: number,
): GesturePoint[] => {
  if (points.length === 0) {
    return [];
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const scale = Math.min(
    (width - pad * 2) / Math.max(w, 1e-6),
    (height - pad * 2) / Math.max(h, 1e-6),
  );
  const s = Number.isFinite(scale) ? scale : 1;
  const offX = (width - w * s) / 2;
  const offY = (height - h * s) / 2;
  return points.map((p) => ({ x: offX + (p.x - minX) * s, y: offY + (p.y - minY) * s }));
};

/** Arrow head at the stroke end: [left wing, tip, right wing], or null for a dot. */
export const arrowHead = (
  points: GesturePoint[],
  size: number,
): [GesturePoint, GesturePoint, GesturePoint] | null => {
  const tip = points[points.length - 1];
  if (tip === undefined) {
    return null;
  }
  // Direction from a point ~2 heads back, so a final jitter does not skew it.
  let from: GesturePoint | undefined;
  for (let i = points.length - 2; i >= 0; i -= 1) {
    from = points[i];
    if (Math.hypot(tip.x - from.x, tip.y - from.y) >= size * 2) {
      break;
    }
  }
  if (from === undefined || (from.x === tip.x && from.y === tip.y)) {
    return null;
  }
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const wing = (offset: number): GesturePoint => ({
    x: tip.x - size * Math.cos(angle + offset),
    y: tip.y - size * Math.sin(angle + offset),
  });
  return [wing(Math.PI / 6), tip, wing(-Math.PI / 6)];
};
