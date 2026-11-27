import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { IconButton } from "@/components/ui";
import { useFlipListAnimation } from "@/hooks/useFlipListAnimation";
import { cx } from "@/utils/cx";

import * as shell from "./AppShell.css";
import * as styles from "./SegmentTabs.css";
import { tabButtonFromPoint } from "./tabBarPointer";
import { useTabReorder } from "./useTabReorder";
import { useTabsPill } from "./useTabsPill";

type SegmentTabItem = {
  id: string;
  label: string;
  suffix?: ReactNode;
  muted?: boolean;
};

interface SegmentTabsProps {
  items: SegmentTabItem[];
  active: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  /** Adds a reorder button at the row's end: drag tabs left/right, then ✓ / ✕. */
  reorder?: {
    lockedIds: readonly string[];
    onCommit: (ids: string[]) => void;
    startLabel: string;
    confirmLabel: string;
    cancelLabel: string;
  };
}

/** Same look and sliding pill as the main tab bar, for any number of tabs. */
export const SegmentTabs = ({ items, active, onSelect, ariaLabel, reorder }: SegmentTabsProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const tabOrder = useTabReorder({
    ids: items.map((item) => item.id),
    lockedIds: reorder?.lockedIds ?? [],
    listRef,
    onCommit: (ids) => reorder?.onCommit(ids),
  });
  const byId = new Map(items.map((item) => [item.id, item]));
  const shown = tabOrder.order
    .map((id) => byId.get(id))
    .filter((item): item is SegmentTabItem => item !== undefined);
  const activeIndex = Math.max(0, shown.findIndex((item) => item.id === active));
  useFlipListAnimation(listRef, "button[role='tab']", tabOrder.order.join("|"));

  useEffect(() => {
    setHover(null);
  }, [active]);

  const { pillStyle, pillNudging } = useTabsPill({
    activeIndex,
    hoverIndex: hover,
    listRef,
    itemsKey: shown.map((item) => item.id).join("|"),
  });

  const syncHover = (event: PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (list === null) {
      return;
    }
    const button = tabButtonFromPoint(list, event.clientX, event.clientY);
    const buttons = Array.from(list.querySelectorAll("button[role='tab']"));
    const index = button === null ? -1 : buttons.indexOf(button);
    setHover(index >= 0 ? index : null);
  };

  return (
    <div className={styles.row}>
    <div
      ref={listRef}
      className={cx(styles.list, tabOrder.editing && styles.listEditing)}
      role="tablist"
      aria-label={ariaLabel}
      onPointerLeave={() => setHover(null)}
      onPointerMove={syncHover}
    >
      <span
        className={shell.tabPill}
        style={tabOrder.editing ? { ...pillStyle, opacity: 0 } : pillStyle}
        data-nudge={pillNudging ? "true" : undefined}
        aria-hidden
      />
      {shown.map((item) => {
        const locked = reorder?.lockedIds.includes(item.id) === true;
        return (
        <button
          key={item.id}
          type="button"
          role="tab"
          data-tab-item=""
          data-own-hover="press"
          data-tab-id={item.id}
          data-flip-id={tabOrder.draggingId === item.id ? undefined : item.id}
          aria-selected={item.id === active}
          className={cx(
            shell.tab,
            styles.item,
            item.id === active && !tabOrder.editing && shell.tabActive,
            item.muted === true && styles.muted,
            tabOrder.editing && (locked ? styles.tabLocked : styles.tabMovable),
            tabOrder.highlightedId === item.id && styles.tabHighlighted,
            tabOrder.draggingId === item.id && styles.tabDragging,
          )}
          onClick={() => {
            if (!tabOrder.editing) {
              onSelect(item.id);
            }
          }}
          {...(tabOrder.editing ? tabOrder.tabHandlers(item.id) : {})}
        >
          <span className={styles.label}>{item.label}</span>
          {item.suffix !== undefined ? (
            <span className={styles.suffix}>{item.suffix}</span>
          ) : null}
        </button>
        );
      })}
    </div>
      {reorder !== undefined ? (
        <div className={styles.reorderControls}>
          {tabOrder.editing ? (
            <>
              <IconButton
                className={cx(styles.iconButton, styles.iconConfirm)}
                label={reorder.confirmLabel}
                onClick={tabOrder.confirm}
              >
                ✓
              </IconButton>
              <IconButton
                className={styles.iconButton}
                label={reorder.cancelLabel}
                onClick={tabOrder.cancel}
              >
                ✕
              </IconButton>
            </>
          ) : (
            <IconButton
              className={styles.iconButton}
              label={reorder.startLabel}
              disabled={items.length - reorder.lockedIds.length < 2}
              onClick={tabOrder.start}
            >
              ⇄
            </IconButton>
          )}
        </div>
      ) : null}
    </div>
  );
};
