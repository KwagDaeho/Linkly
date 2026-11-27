import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  autoScrollViewport,
  itemShiftY,
  measureStride,
  pointerListY,
  updateOverIndex,
  type DragState,
} from "@/domain/list/dragReorder";

interface UseDragReorderOptions {
  count: number;
  /** Called once on drop when the position changed. */
  onReorder: (from: number, to: number) => void;
}

/**
 * Pointer drag-to-reorder for a list whose direct children are the rows.
 *
 * The highlighted row is tracked as state by index (not CSS `:hover`): after a drop
 * the highlight lands on the row's new slot immediately instead of lingering on the
 * old one until the mouse moves.
 */
export const useDragReorder = (options: UseDragReorderOptions) => {
  const countRef = useRef(options.count);
  const onReorderRef = useRef(options.onReorder);
  const listRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<PointerEvent | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  countRef.current = options.count;
  onReorderRef.current = options.onReorder;

  useEffect(() => {
    const flushPointer = () => {
      frameRef.current = null;
      const event = pendingPointerRef.current;
      const active = dragRef.current;
      const list = listRef.current;
      if (!event || !active || !list) {
        return;
      }
      autoScrollViewport(viewportRef.current, event.clientY);
      const y = pointerListY(event.clientY, list, viewportRef.current);
      const swap = updateOverIndex(
        y,
        active.overIndex,
        active.stride,
        countRef.current,
        event.clientY,
        active.lastSwapClientY,
      );
      const offsetY = event.clientY - active.startClientY;
      if (swap.overIndex === active.overIndex && offsetY === active.offsetY) {
        return;
      }
      active.overIndex = swap.overIndex;
      active.lastSwapClientY = swap.lastSwapClientY;
      active.offsetY = offsetY;
      setDrag({ ...active });
    };

    const onMove = (event: PointerEvent) => {
      const active = dragRef.current;
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }
      pendingPointerRef.current = event;
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(flushPointer);
      }
    };

    const endDrag = (event: PointerEvent) => {
      const active = dragRef.current;
      if (!active || event.pointerId !== active.pointerId) {
        return;
      }
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      pendingPointerRef.current = null;
      if (active.fromIndex !== active.overIndex) {
        onReorderRef.current(active.fromIndex, active.overIndex);
      }
      dragRef.current = null;
      setDrag(null);
      // The pointer is over the row's new slot.
      setHoverIndex(active.overIndex);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const startDrag = (index: number, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const next: DragState = {
      fromIndex: index,
      overIndex: index,
      pointerId: event.pointerId,
      offsetY: 0,
      startClientY: event.clientY,
      stride: measureStride(listRef.current, index),
      lastSwapClientY: event.clientY,
    };
    dragRef.current = next;
    setDrag(next);
    setHoverIndex(index);
  };

  /** Spread onto the drag handle of row `index`. */
  const handleProps = (index: number) => ({
    "data-drag-handle": "",
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startDrag(index, event),
    onPointerEnter: () => {
      if (dragRef.current === null) {
        setHoverIndex(index);
      }
    },
    onPointerLeave: () => {
      if (dragRef.current === null) {
        setHoverIndex((current) => (current === index ? null : current));
      }
    },
  });

  /** Row state: transform while dragging, highlight while its handle is hovered/dragged. */
  const rowState = (index: number): {
    dragging: boolean;
    highlighted: boolean;
    style: CSSProperties | undefined;
  } => {
    const dragging = drag?.fromIndex === index;
    const shiftY = drag ? itemShiftY(index, drag) : 0;
    return {
      dragging,
      highlighted: drag ? dragging : hoverIndex === index,
      style: drag
        ? {
            transform: dragging
              ? `translateY(${drag.offsetY}px)`
              : shiftY
                ? `translateY(${shiftY}px)`
                : undefined,
          }
        : undefined,
    };
  };

  return { listRef, viewportRef, dragging: drag !== null, handleProps, rowState };
};
