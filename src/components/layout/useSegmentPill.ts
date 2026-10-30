import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { tabHoverNudge } from "@/components/ui/panelLayout";

import {
  pillStyleForProgress,
  readSegmentButtonPair,
} from "./segmentPillMeasure";

export type BinarySegment = 0 | 1;

const pillProgress = (
  active: BinarySegment,
  hover: BinarySegment | null,
  hoverNudge: number,
): number => {
  if (hover === null) {
    return active;
  }
  if (hover === active) {
    return active;
  }
  return active + (hover - active) * hoverNudge;
};

interface UseSegmentPillOptions {
  active: BinarySegment;
  hover: BinarySegment | null;
  listRef: RefObject<HTMLElement | null>;
  segmentSelector: string;
  /** Default matches section tabs; header chrome uses a larger nudge. */
  hoverNudge?: number;
}

export const useSegmentPill = (options: UseSegmentPillOptions) => {
  const {
    active,
    hover,
    listRef,
    segmentSelector,
    hoverNudge = tabHoverNudge,
  } = options;
  const [pillStyle, setPillStyle] = useState<CSSProperties>({ opacity: 0 });

  const readButtons = useCallback(() => {
    const list = listRef.current;
    if (list === null) {
      return null;
    }
    const buttons = list.querySelectorAll<HTMLButtonElement>(segmentSelector);
    const start = buttons.item(0);
    const end = buttons.item(1);
    if (start === null || end === null) {
      return null;
    }
    return readSegmentButtonPair(list, start, end);
  }, [listRef, segmentSelector]);

  const applyPillProgress = useCallback(
    (progress: number) => {
      const pair = readButtons();
      if (pair === null) {
        return;
      }
      setPillStyle(pillStyleForProgress(pair, progress));
    },
    [readButtons],
  );

  const syncPill = useCallback(() => {
    applyPillProgress(pillProgress(active, hover, hoverNudge));
  }, [active, applyPillProgress, hover, hoverNudge]);

  useLayoutEffect(() => {
    syncPill();
    const id = requestAnimationFrame(() => syncPill());
    return () => cancelAnimationFrame(id);
  }, [syncPill, active, hover]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(syncPill);
    observer.observe(list);
    const buttons = list.querySelectorAll(segmentSelector);
    buttons.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [listRef, segmentSelector, syncPill]);

  return {
    pillStyle,
    pillNudging: hover !== null,
  };
};
