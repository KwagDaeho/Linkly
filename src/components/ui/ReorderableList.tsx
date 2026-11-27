import { Fragment, type CSSProperties, type ReactNode } from "react";

import { overlayScrollAreaStyles } from "@/components/layout/OverlayScrollArea";
import { useDragReorder } from "@/hooks/useDragReorder";
import { cx } from "@/utils/cx";

import * as reorder from "./reorder.css";

export type ReorderRowProps = {
  /** Drag handle to place in the row (first cell). */
  handle: ReactNode;
  className: string | undefined;
  style: CSSProperties | undefined;
};

interface ReorderableListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  onReorder: (from: number, to: number) => void;
  hint: string;
  className?: string;
  renderRow: (item: T, index: number, row: ReorderRowProps) => ReactNode;
}

/** Rows reordered by dragging their handle; the row border lights up on handle hover. */
export const ReorderableList = <T,>(props: ReorderableListProps<T>) => {
  const { listRef, viewportRef, dragging, handleProps, rowState } = useDragReorder({
    count: props.items.length,
    onReorder: props.onReorder,
  });
  return (
    <div
      ref={(node) => {
        listRef.current = node;
        viewportRef.current =
          node?.closest<HTMLElement>(`.${overlayScrollAreaStyles.viewport}`) ?? null;
      }}
      className={cx(props.className, dragging && reorder.listDragging)}
    >
      {props.items.map((item, index) => {
        const row = rowState(index);
        return (
          <Fragment key={props.getKey(item)}>
            {props.renderRow(item, index, {
              handle: (
                <button
                  type="button"
                  className={reorder.dragHandle}
                  aria-label={props.hint}
                  title={props.hint}
                  {...handleProps(index)}
                >
                  <span className={reorder.dragDots} aria-hidden>
                    ⋮⋮
                  </span>
                </button>
              ),
              className: cx(
                row.highlighted && reorder.rowHighlighted,
                row.dragging && reorder.rowDragging,
              ) || undefined,
              style: row.style,
            })}
          </Fragment>
        );
      })}
    </div>
  );
};
