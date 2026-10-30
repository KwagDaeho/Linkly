import { useLayoutEffect, useRef, type RefObject } from "react";

import { listReorderTransition } from "@/components/ui/panelLayout";

type RectSnapshot = { top: number; left: number };

export const useFlipListAnimation = (
  listRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  orderKey: string,
) => {
  const positionsRef = useRef<Map<string, RectSnapshot>>(new Map());

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const nodes = list.querySelectorAll<HTMLElement>(itemSelector);
    const next = new Map<string, RectSnapshot>();

    nodes.forEach((node) => {
      const id = node.dataset.flipId;
      if (id === undefined) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const prev = positionsRef.current.get(id);
      if (prev !== undefined) {
        const dy = prev.top - rect.top;
        const dx = prev.left - rect.left;
        if (Math.abs(dy) > 0.5 || Math.abs(dx) > 0.5) {
          node.style.transition = "none";
          node.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              node.style.transition = listReorderTransition;
              node.style.transform = "";
            });
          });
        }
      }
      next.set(id, { top: rect.top, left: rect.left });
    });

    positionsRef.current = next;
  }, [itemSelector, listRef, orderKey]);
};
