import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import type { TabId } from "@/types";

const tabIndex = (tab: TabId): number => (tab === "custom" ? 1 : 0);

interface UseTabPillOptions {
  tab: TabId;
  listRef: RefObject<HTMLElement | null>;
  labels: readonly [string, string];
}

export const useTabPill = (options: UseTabPillOptions) => {
  const { tab, listRef, labels } = options;
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

  const syncPillToTab = useCallback(() => {
    const pair = readButtons();
    if (pair === null) {
      return;
    }
    const t = tabIndex(tab);
    const { listRect, startRect, endRect } = pair;
    setPillStyle({
      left:
        startRect.left - listRect.left + t * (endRect.left - startRect.left),
      top: startRect.top - listRect.top + t * (endRect.top - startRect.top),
      width: startRect.width + t * (endRect.width - startRect.width),
      height: startRect.height + t * (endRect.height - startRect.height),
      opacity: 1,
    });
  }, [readButtons, tab]);

  useLayoutEffect(() => {
    syncPillToTab();
    const id = requestAnimationFrame(() => syncPillToTab());
    return () => cancelAnimationFrame(id);
  }, [syncPillToTab, labels[0], labels[1], tab]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(syncPillToTab);
    observer.observe(list);
    const buttons = list.querySelectorAll("button[role='tab']");
    buttons.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [listRef, syncPillToTab]);

  return { pillStyle };
};
