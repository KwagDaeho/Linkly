import { useEffect, useRef, useState } from "react";

import { ACCENT_DEFAULT } from "@/constants/accent";
import { Modal, ModalActions, Muted } from "@/components/ui";
import { arrowHead, fitPoints, MIN_GESTURE_LENGTH, pathLength } from "@/domain/gesture/fit";
import { usePrefs } from "@/hooks";
import { useGestureRecording } from "@/hooks/useGestureRecording";
import type { GesturePoint } from "@/types/profile/gesture";

import * as styles from "./GesturePanel.css";

const W = 440;
const H = 260;
const PAD = 40;

interface GestureDrawModalProps {
  /** Existing shape (redraw), shown until a new stroke arrives. */
  initial?: GesturePoint[];
  /** A hold or toggle key is assigned. */
  ready: boolean;
  onSave: (points: GesturePoint[]) => void;
  onClose: () => void;
}

/**
 * Shapes are drawn with the gesture keys themselves (same motion as when they are
 * used later); the backend records the stroke while this dialog is open.
 */
export const GestureDrawModal = ({ initial, ready, onSave, onClose }: GestureDrawModalProps) => {
  const { i18n } = usePrefs();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<GesturePoint[]>([]);
  const valid = pathLength(points) >= MIN_GESTURE_LENGTH;

  useGestureRecording((stroke) => {
    if (pathLength(stroke) >= MIN_GESTURE_LENGTH) {
      setPoints(stroke);
    }
  });

  const shown = fitPoints(points.length > 0 ? points : (initial ?? []), W, H, PAD);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas === null || ctx === null || ctx === undefined) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (shown.length === 0) {
      return;
    }
    const accent = getComputedStyle(canvas).getPropertyValue("--accent").trim() || ACCENT_DEFAULT;
    ctx.globalAlpha = points.length > 0 ? 1 : 0.45;
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(shown[0].x, shown[0].y);
    for (const p of shown.slice(1)) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(shown[0].x, shown[0].y, 5, 0, Math.PI * 2);
    ctx.fill();
    const head = arrowHead(shown, 14);
    if (head !== null) {
      ctx.beginPath();
      ctx.moveTo(head[0].x, head[0].y);
      ctx.lineTo(head[1].x, head[1].y);
      ctx.lineTo(head[2].x, head[2].y);
      ctx.stroke();
    }
  }, [shown, points.length]);

  // Portal: the trigger section slides with a transform that would trap a fixed modal.
  return (
    <Modal
      portal
      title={i18n.gestureDrawTitle}
      onBackdropClick={onClose}
      onEscape={onClose}
    >
      <Muted as="p" className={styles.drawHint}>
        {ready ? i18n.gestureDrawHint : i18n.gestureDrawNeedsKey}
      </Muted>
      <canvas ref={canvasRef} className={styles.canvas} />
      <ModalActions
        cancelLabel={i18n.cancel}
        onCancel={onClose}
        confirmLabel={i18n.save}
        onConfirm={() => onSave(points)}
        confirmDisabled={!valid}
      />
    </Modal>
  );
};
