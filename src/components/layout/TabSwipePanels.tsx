import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import type { TabId } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./TabSwipePanels.css";

const TAB_ORDER: TabId[] = ["info", "custom"];
const SWIPE_COMMIT_PX = 56;
const SWIPE_MAX_DRAG_RATIO = 0.38;
const TRANSITION_MS = 380;
const TRANSITION_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const tabIndex = (tab: TabId): number =>
  TAB_ORDER.indexOf(tab) === -1 ? 0 : TAB_ORDER.indexOf(tab);

const isSwipeBlockedTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.closest(
      "button, a, input, select, textarea, label, summary, [role='button'], [contenteditable='true']",
    ) !== null
  );
};

interface TabSwipePanelsProps {
  active: TabId;
  onActiveChange: (tab: TabId) => void;
  info: ReactNode;
  link: ReactNode;
}

export const TabSwipePanels = (props: TabSwipePanelsProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(0);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    axis: "none" | "x" | "y";
  } | null>(null);

  const index = tabIndex(props.active);

  const clampDrag = useCallback(
    (raw: number, atIndex: number): number => {
      const width = viewportRef.current?.clientWidth ?? 0;
      const max = width * SWIPE_MAX_DRAG_RATIO;
      if (atIndex === 0 && raw > 0) {
        return raw * 0.22;
      }
      if (atIndex === TAB_ORDER.length - 1 && raw < 0) {
        return raw * 0.22;
      }
      return Math.max(-max, Math.min(max, raw));
    },
    [],
  );

  const { active, onActiveChange } = props;

  const finishDrag = useCallback(
    (commit: boolean) => {
      const width = viewportRef.current?.clientWidth ?? 0;
      const offset = dragRef.current;
      let next = active;
      if (commit) {
        if (index === 0 && offset <= -SWIPE_COMMIT_PX) {
          next = "custom";
        } else if (index === 1 && offset >= SWIPE_COMMIT_PX) {
          next = "info";
        }
      } else if (width > 0) {
        const progress = Math.abs(offset) / width;
        if (index === 0 && progress > 0.18 && offset < 0) {
          next = "custom";
        } else if (index === 1 && progress > 0.18 && offset > 0) {
          next = "info";
        }
      }
      dragRef.current = 0;
      setDragPx(0);
      setDragging(false);
      pointerRef.current = null;
      if (next !== active) {
        onActiveChange(next);
      }
    },
    [active, index, onActiveChange],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    if (isSwipeBlockedTarget(event.target)) {
      return;
    }
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: "none",
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = pointerRef.current;
    if (session === null || session.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (session.axis === "none") {
      if (
        Math.abs(dx) < 6 &&
        Math.abs(dy) < 6
      ) {
        return;
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        session.axis = "y";
        event.currentTarget.releasePointerCapture(event.pointerId);
        pointerRef.current = null;
        return;
      }
      session.axis = "x";
      setDragging(true);
    }
    if (session.axis !== "x") {
      return;
    }
    const clamped = clampDrag(dx, index);
    dragRef.current = clamped;
    setDragPx(clamped);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const session = pointerRef.current;
    if (session === null || session.id !== event.pointerId) {
      return;
    }
    if (session.axis === "x") {
      finishDrag(true);
    } else {
      pointerRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.axis === "x") {
      finishDrag(false);
    } else {
      pointerRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const offsetPercent = index * 50;
  const expandHeights = dragging;

  return (
    <div
      ref={viewportRef}
      className={styles.root}
      data-dragging={dragging ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className={styles.track}
        style={{
          transform: `translate3d(calc(-${offsetPercent}% + ${dragPx}px), 0, 0)`,
          transition: dragging
            ? "none"
            : `transform ${TRANSITION_MS}ms ${TRANSITION_EASE}`,
        }}
      >
        <div
          className={cx(
            styles.page,
            props.active !== "info" && styles.pageInactive,
            !expandHeights &&
              props.active !== "info" &&
              styles.pageCollapsed,
          )}
          role="tabpanel"
          aria-hidden={props.active !== "info"}
          id="tabpanel-info"
        >
          {props.info}
        </div>
        <div
          className={cx(
            styles.page,
            props.active !== "custom" && styles.pageInactive,
            !expandHeights &&
              props.active !== "custom" &&
              styles.pageCollapsed,
          )}
          role="tabpanel"
          aria-hidden={props.active !== "custom"}
          id="tabpanel-custom"
        >
          {props.link}
        </div>
      </div>
    </div>
  );
};
