import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { MAIN_TABS } from "@/constants/tabs";
import { usePrefs } from "@/hooks";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./AppShell.css";
import { hoverTabFromPointer } from "./tabBarPointer";
import { useTabPill } from "./useTabPill";

const tabLabel = (
  tab: TabId,
  i18n: ReturnType<typeof usePrefs>["i18n"],
): string => {
  switch (tab) {
    case "trigger":
      return i18n.tabTrigger;
    case "mouse":
      return i18n.tabMouse;
    case "system":
      return i18n.tabSystem;
    default:
      return tab;
  }
};

interface TabBarProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
}

export const TabBar = ({ tab, onTab }: TabBarProps) => {
  const { i18n } = usePrefs();
  const tabListRef = useRef<HTMLElement>(null);
  const [hoverTab, setHoverTab] = useState<TabId | null>(null);

  useEffect(() => {
    setHoverTab(null);
  }, [tab]);

  const { pillStyle, pillNudging } = useTabPill({
    tab,
    hoverTab,
    listRef: tabListRef,
  });

  const clearHover = () => setHoverTab(null);

  const syncHoverFromPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const nav = tabListRef.current;
    if (nav === null) {
      return;
    }
    const next = hoverTabFromPointer(nav, event.clientX, event.clientY);
    setHoverTab(next);
  };

  return (
    <nav
      ref={tabListRef}
      className={styles.tabs}
      aria-label="Sections"
      role="tablist"
      onPointerLeave={clearHover}
      onPointerMove={syncHoverFromPointer}
    >
      <span
        className={styles.tabPill}
        style={pillStyle}
        data-nudge={pillNudging ? "true" : undefined}
        aria-hidden
      />
      {MAIN_TABS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          data-tab-item=""
          aria-selected={tab === id}
          aria-controls={`tabpanel-${id}`}
          className={cx(styles.tab, tab === id && styles.tabActive)}
          onClick={() => {
            clearHover();
            onTab(id);
          }}
          onPointerEnter={() => setHoverTab(id)}
        >
          {tabLabel(id, i18n)}
        </button>
      ))}
    </nav>
  );
};
