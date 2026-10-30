import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import type { TabId } from "@/types";

const tabIndex = (tab: TabId): number => (tab === "custom" ? 1 : 0);

/** Fraction of the gap between tabs (toggle-like nudge). */
const HOVER_NUDGE = 0.045;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const pillProgress = (active: TabId, hover: TabId | null): number => {
  const activeIndex = tabIndex(active);
  if (hover === null) {
    return activeIndex;
  }
  const hoverIndex = tabIndex(hover);
  if (hoverIndex === activeIndex) {
    return activeIndex;
  }
  return activeIndex + (hoverIndex - activeIndex) * HOVER_NUDGE;
};

interface UseTabPillOptions {
  tab: TabId;
  hoverTab: TabId | null;
  listRef: RefObject<HTMLElement | null>;
  labels: readonly [string, string];
}

export const useTabPill = (options: UseTabPillOptions) => {
  const { tab, hoverTab, listRef, labels } = options;
  const [pillStyle, setPillStyle] = useState<CSSProperties>({ opacity: 0 });

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
    const listRect = list.getBoundingClientRect();
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    const span = endRect.left - startRect.left;
    if (span <= 1) {
      return null;
    }
    return { listRect, startRect, endRect, span };
  }, [listRef]);

  const applyPillProgress = useCallback(
    (progress: number) => {
      const pair = readButtons();
      if (pair === null) {
        return;
      }
      const t = clamp(progress, 0, 1);
      const { listRect, startRect, endRect } = pair;
      setPillStyle({
        left:
          startRect.left - listRect.left + t * (endRect.left - startRect.left),
        top: startRect.top - listRect.top + t * (endRect.top - startRect.top),
        width: startRect.width + t * (endRect.width - startRect.width),
        height: startRect.height + t * (endRect.height - startRect.height),
        opacity: 1,
      });
    },
    [readButtons],
  );

  const syncPill = useCallback(() => {
    applyPillProgress(pillProgress(tab, hoverTab));
  }, [applyPillProgress, hoverTab, tab]);

  useLayoutEffect(() => {
    syncPill();
    const id = requestAnimationFrame(() => syncPill());
    return () => cancelAnimationFrame(id);
  }, [syncPill, labels[0], labels[1], tab, hoverTab]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(syncPill);
    observer.observe(list);
    const buttons = list.querySelectorAll("button[role='tab']");
    buttons.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [listRef, syncPill]);

  return { pillStyle, pillNudging: hoverTab !== null };
};
