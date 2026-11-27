import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { cx } from "@/utils/cx";

import * as shell from "./AppShell.css";
import * as styles from "./SegmentTabs.css";
import { tabButtonFromPoint } from "./tabBarPointer";
import { useTabsPill } from "./useTabsPill";

export type SegmentTabItem = {
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
}

/** Same look and sliding pill as the main tab bar, for any number of tabs. */
export const SegmentTabs = ({ items, active, onSelect, ariaLabel }: SegmentTabsProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));

  useEffect(() => {
    setHover(null);
  }, [active]);

  const { pillStyle, pillNudging } = useTabsPill({
    activeIndex,
    hoverIndex: hover,
    listRef,
    itemsKey: items.map((item) => item.id).join("|"),
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
    <div
      ref={listRef}
      className={styles.list}
      role="tablist"
      aria-label={ariaLabel}
      onPointerLeave={() => setHover(null)}
      onPointerMove={syncHover}
    >
      <span
        className={shell.tabPill}
        style={pillStyle}
        data-nudge={pillNudging ? "true" : undefined}
        aria-hidden
      />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          data-tab-item=""
          aria-selected={item.id === active}
          className={cx(
            shell.tab,
            styles.item,
            item.id === active && shell.tabActive,
            item.muted === true && styles.muted,
          )}
          onClick={() => onSelect(item.id)}
        >
          <span className={styles.label}>{item.label}</span>
          {item.suffix !== undefined ? (
            <span className={styles.suffix}>{item.suffix}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
};
