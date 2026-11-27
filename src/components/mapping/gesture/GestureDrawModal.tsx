import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button, Modal, ModalFooter, Muted } from "@/components/ui";
import { arrowHead, fitPoints, MIN_GESTURE_LENGTH, pathLength } from "@/domain/gesture/fit";
import { usePrefs } from "@/hooks";
import { setGestureRecording } from "@/services/tauri";
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

  useEffect(() => {
    void setGestureRecording(true).catch(() => undefined);
    const off = listen<GesturePoint[]>("gesture-recorded", (event) => {
      if (pathLength(event.payload) >= MIN_GESTURE_LENGTH) {
        setPoints(event.payload);
      }
    });
    return () => {
      void off.then((un) => un());
      void setGestureRecording(false).catch(() => undefined);
    };
  }, []);

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
    const accent = getComputedStyle(canvas).getPropertyValue("--accent").trim() || "#c07bc4";
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
  return createPortal(
    <Modal onBackdropClick={onClose} onEscape={onClose}>
      <h2>{i18n.gestureDrawTitle}</h2>
      <Muted as="p" className={styles.drawHint}>
        {ready ? i18n.gestureDrawHint : i18n.gestureDrawNeedsKey}
      </Muted>
      <canvas ref={canvasRef} className={styles.canvas} />
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          {i18n.cancel}
        </Button>
        <Button disabled={!valid} onClick={() => onSave(points)}>
          {i18n.save}
        </Button>
      </ModalFooter>
    </Modal>,
    document.body,
  );
};
