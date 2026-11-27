import { arrowHead, fitPoints } from "@/domain/gesture/fit";
import type { GesturePoint } from "@/types/profile/gesture";

import * as styles from "./GesturePanel.css";

const W = 56;
const H = 36;

/** Small preview of a gesture; the dot marks where drawing starts. */
export const GestureThumbnail = ({ points }: { points: GesturePoint[] }) => {
  const fitted = fitPoints(points, W, H, 5);
  const start = fitted[0];
  const head = arrowHead(fitted, 5);
  return (
    <svg className={styles.thumb} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={fitted.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {head !== null ? (
        <polyline
          points={head.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {start !== undefined ? <circle cx={start.x} cy={start.y} r={2.6} fill="currentColor" /> : null}
    </svg>
  );
};
