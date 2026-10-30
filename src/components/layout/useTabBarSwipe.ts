import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import type { TabId } from "@/types";

const TAB_COMMIT_PX = 40;

const tabIndex = (tab: TabId): number => (tab === "custom" ? 1 : 0);

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

interface UseTabBarSwipeOptions {
  tab: TabId;
  onTab: (tab: TabId) => void;
  listRef: RefObject<HTMLElement | null>;
  labels: readonly [string, string];
}

export const useTabBarSwipe = (options: UseTabBarSwipeOptions) => {
  const { tab, onTab, listRef, labels } = options;
  const [pillStyle, setPillStyle] = useState<CSSProperties>({ opacity: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const dragPxRef = useRef(0);
  const suppressClickRef = useRef(false);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    axis: "none" | "x" | "y";
  } | null>(null);

  const readButtons = useCallback(() => {
    const list = listRef.current;
    if (list === null) {
      return null;
    }
    const buttons = list.querySelectorAll<HTMLButtonElement>(
      "button[role='tab']",
    );
    const start = buttons.item(0);
    const end = buttons.item(1);
    if (start === null || end === null) {
      return null;
    }
    const span = end.offsetLeft - start.offsetLeft;
    if (span <= 0) {
      return null;
    }
    return { start, end, span };
  }, [listRef]);

  const slotSpanPx = useCallback((): number => {
    return readButtons()?.span ?? 0;
  }, [readButtons]);

  const applyPillProgress = useCallback(
    (progress: number) => {
      const pair = readButtons();
      if (pair === null) {
        return;
      }
      const t = clamp(progress, 0, 1);
      const { start, end } = pair;
      setPillStyle({
        left: start.offsetLeft + t * (end.offsetLeft - start.offsetLeft),
        top: start.offsetTop + t * (end.offsetTop - start.offsetTop),
        width: start.offsetWidth + t * (end.offsetWidth - start.offsetWidth),
        height: start.offsetHeight + t * (end.offsetHeight - start.offsetHeight),
        opacity: 1,
      });
    },
    [readButtons],
  );

  const syncPillToTab = useCallback(() => {
    if (dragging) {
      return;
    }
    applyPillProgress(tabIndex(tab));
  }, [applyPillProgress, dragging, tab]);

  useLayoutEffect(() => {
    syncPillToTab();
  }, [syncPillToTab, labels[0], labels[1]]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(syncPillToTab);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef, syncPillToTab]);

  const updateDragPill = useCallback(
    (dragPx: number) => {
      const span = slotSpanPx();
      if (span <= 0) {
        return;
      }
      const progress = tabIndex(tab) - dragPx / span;
      applyPillProgress(progress);
      setDragProgress(clamp(progress, 0, 1));
    },
    [applyPillProgress, slotSpanPx, tab],
  );

  const finishDrag = useCallback(
    (commit: boolean) => {
      const span = slotSpanPx();
      const dragPx = dragPxRef.current;
      dragPxRef.current = 0;
      setDragging(false);
      setDragProgress(null);
      pointerRef.current = null;

      if (!commit || span <= 0) {
        syncPillToTab();
        return;
      }

      let progress = tabIndex(tab) - dragPx / span;
      progress = clamp(progress, 0, 1);
      if (Math.abs(dragPx) >= TAB_COMMIT_PX) {
        onTab(progress >= 0.5 ? "custom" : "info");
      } else if (progress >= 0.5 && tab !== "custom") {
        onTab("custom");
      } else if (progress < 0.5 && tab !== "info") {
        onTab("info");
      } else {
        syncPillToTab();
      }
    },
    [onTab, slotSpanPx, syncPillToTab, tab],
  );

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    suppressClickRef.current = false;
    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: "none",
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const session = pointerRef.current;
    if (session === null || session.id !== event.pointerId) {
      return;
    }
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;
    if (session.axis === "none") {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
        return;
      }
      if (Math.abs(dy) > Math.abs(dx)) {
        session.axis = "y";
        pointerRef.current = null;
        return;
      }
      session.axis = "x";
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (session.axis !== "x") {
      return;
    }
    const span = slotSpanPx();
    const atIndex = tabIndex(tab);
    let dragPx = dx;
    if (atIndex === 0 && dragPx > 0) {
      dragPx *= 0.25;
    }
    if (atIndex === 1 && dragPx < 0) {
      dragPx *= 0.25;
    }
    if (span > 0) {
      dragPx = clamp(dragPx, -span, span);
    }
    dragPxRef.current = dragPx;
    if (Math.abs(dragPx) >= 8) {
      suppressClickRef.current = true;
    }
    updateDragPill(dragPx);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const session = pointerRef.current;
    if (session === null || session.id !== event.pointerId) {
      return;
    }
    if (session.axis === "x") {
      if (Math.abs(dragPxRef.current) < 8) {
        suppressClickRef.current = false;
      }
      finishDrag(true);
    } else {
      pointerRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerRef.current?.axis === "x") {
      if (Math.abs(dragPxRef.current) < 8) {
        suppressClickRef.current = false;
      }
      finishDrag(false);
    } else {
      pointerRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const shouldIgnoreClick = useCallback(() => {
    if (!suppressClickRef.current) {
      return false;
    }
    suppressClickRef.current = false;
    return true;
  }, []);

  const visualTab: TabId =
    dragProgress !== null
      ? dragProgress >= 0.5
        ? "custom"
        : "info"
      : tab;

  return {
    pillStyle,
    dragging,
    visualTab,
    tabBarHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    shouldIgnoreClick,
  };
};
