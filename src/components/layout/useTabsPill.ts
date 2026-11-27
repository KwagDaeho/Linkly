import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { tabHoverNudge } from "@/components/ui/panelLayout";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

type Box = { left: number; top: number; width: number; height: number };

/** Button box relative to the list's padding box (works for wrapped rows too). */
const boxOf = (list: HTMLElement, button: HTMLElement): Box => {
  const listRect = list.getBoundingClientRect();
  const rect = button.getBoundingClientRect();
  return {
    left: rect.left - listRect.left - list.clientLeft,
    top: rect.top - listRect.top - list.clientTop,
    width: rect.width,
    height: rect.height,
  };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface UseTabsPillOptions {
  activeIndex: number;
  hoverIndex: number | null;
  listRef: RefObject<HTMLElement | null>;
  /** Changes when the set of tab buttons changes (re-measure). */
  itemsKey?: string;
}

/** Sliding pill under `button[role='tab']` children of `listRef` (any tab count). */
export const useTabsPill = (options: UseTabsPillOptions) => {
  const { activeIndex, hoverIndex, listRef, itemsKey } = options;
  const [pillStyle, setPillStyle] = useState<CSSProperties>({ opacity: 0 });
  const resizeFrameRef = useRef<number | null>(null);

  const syncPill = useCallback(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const buttons = Array.from(
      list.querySelectorAll<HTMLButtonElement>("button[role='tab']"),
    );
    if (buttons.length === 0) {
      return;
    }
    const active = buttons[clamp(activeIndex, 0, buttons.length - 1)];
    if (active === undefined) {
      return;
    }
    const from = boxOf(list, active);
    const hovered =
      hoverIndex === null || hoverIndex === activeIndex ? undefined : buttons[hoverIndex];
    // Nudge a little toward the hovered tab.
    const to = hovered === undefined ? from : boxOf(list, hovered);
    setPillStyle({
      left: lerp(from.left, to.left, tabHoverNudge),
      top: lerp(from.top, to.top, tabHoverNudge),
      width: lerp(from.width, to.width, tabHoverNudge),
      height: lerp(from.height, to.height, tabHoverNudge),
      opacity: 1,
    });
  }, [activeIndex, hoverIndex, listRef]);

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
  }, [syncPill, itemsKey]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(() => scheduleResizeSync());
    observer.observe(list);
    list
      .querySelectorAll("button[role='tab']")
      .forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [listRef, scheduleResizeSync, itemsKey]);

  return {
    pillStyle,
    pillNudging: hoverIndex !== null && hoverIndex !== activeIndex,
  };
};
