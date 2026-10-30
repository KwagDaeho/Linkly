import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { MAIN_TABS } from "@/constants/tabs";
import { tabHoverNudge } from "@/components/ui/panelLayout";
import type { TabId } from "@/types";

import { pillStyleForMultiProgress } from "./segmentPillMeasure";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const tabIndex = (tab: TabId): number => {
  const index = MAIN_TABS.indexOf(tab);
  return index >= 0 ? index : 0;
};

const pillProgress = (active: TabId, hover: TabId | null): number => {
  const activeIndex = tabIndex(active);
  if (hover === null) {
    return activeIndex;
  }
  const hoverIndex = tabIndex(hover);
  if (hoverIndex === activeIndex) {
    return activeIndex;
  }
  return activeIndex + (hoverIndex - activeIndex) * tabHoverNudge;
};

interface UseTabPillOptions {
  tab: TabId;
  hoverTab: TabId | null;
  listRef: RefObject<HTMLElement | null>;
}

export const useTabPill = (options: UseTabPillOptions) => {
  const { tab, hoverTab, listRef } = options;
  const [pillStyle, setPillStyle] = useState<CSSProperties>({ opacity: 0 });
  const resizeFrameRef = useRef<number | null>(null);

  const readButtons = useCallback(() => {
    const list = listRef.current;
    if (list === null) {
      return null;
    }
    const buttons = Array.from(
      list.querySelectorAll<HTMLButtonElement>("button[role='tab']"),
    );
    if (buttons.length < 2) {
      return null;
    }
    return { list, buttons };
  }, [listRef]);

  const applyPillProgress = useCallback(
    (progress: number) => {
      const pair = readButtons();
      if (pair === null) {
        return;
      }
      const style = pillStyleForMultiProgress(
        pair.list,
        pair.buttons,
        clamp(progress, 0, pair.buttons.length - 1),
      );
      if (style === null) {
        return;
      }
      setPillStyle(style);
    },
    [readButtons],
  );

  const syncPill = useCallback(() => {
    applyPillProgress(pillProgress(tab, hoverTab));
  }, [applyPillProgress, hoverTab, tab]);

  const scheduleResizeSync = useCallback(() => {
    if (resizeFrameRef.current !== null) {
      return;
    }
    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      syncPill();
    });
  }, [syncPill]);

  useLayoutEffect(() => {
    syncPill();
    const id = requestAnimationFrame(() => syncPill());
    return () => cancelAnimationFrame(id);
  }, [syncPill, tab, hoverTab]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(() => scheduleResizeSync());
    observer.observe(list);
    const buttons = list.querySelectorAll("button[role='tab']");
    buttons.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [listRef, scheduleResizeSync]);

  const pillNudging =
    hoverTab !== null && hoverTab !== tab;

  return { pillStyle, pillNudging };
};
