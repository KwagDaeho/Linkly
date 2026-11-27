import { useLayoutEffect, useRef, type RefObject } from "react";

import { listReorderTransition } from "@/components/ui/panelLayout";

type Position = { top: number; left: number };

/**
 * FLIP-animates items (`data-flip-id`) to their new slots when `orderKey` changes.
 *
 * Positions are re-measured after every render, from layout offsets (which ignore
 * running transforms). A snapshot only taken on order changes goes stale whenever the
 * layout moves without one (accordion opening, fonts settling), and the first reorder
 * afterwards made unrelated items jump.
 */
export const useFlipListAnimation = (
  listRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  orderKey: string,
) => {
  const positionsRef = useRef<Map<string, Position>>(new Map());
  const orderKeyRef = useRef(orderKey);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const reordered = orderKeyRef.current !== orderKey;
    orderKeyRef.current = orderKey;
    const next = new Map<string, Position>();

    list.querySelectorAll<HTMLElement>(itemSelector).forEach((node) => {
      const id = node.dataset.flipId;
      if (id === undefined) {
        return;
      }
      const position = { top: node.offsetTop, left: node.offsetLeft };
      next.set(id, position);
      const prev = positionsRef.current.get(id);
      if (!reordered || prev === undefined) {
        return;
      }
      const dy = prev.top - position.top;
      const dx = prev.left - position.left;
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
    });

    positionsRef.current = next;
  });
};
