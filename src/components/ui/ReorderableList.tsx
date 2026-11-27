import { Fragment, type CSSProperties, type ReactNode } from "react";

import { useDragReorder } from "@/hooks/useDragReorder";
import { cx } from "@/utils/cx";

import { DragHandle } from "./DragHandle";
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
  const { bindList, dragging, handleProps, rowState } = useDragReorder({
    count: props.items.length,
    onReorder: props.onReorder,
  });
  return (
    <div
      ref={bindList}
      className={cx(props.className, dragging && reorder.listDragging)}
    >
      {props.items.map((item, index) => {
        const row = rowState(index);
        return (
          <Fragment key={props.getKey(item)}>
            {props.renderRow(item, index, {
              handle: <DragHandle label={props.hint} {...handleProps(index)} />,
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
