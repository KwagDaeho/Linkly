import { useRef, useState } from "react";

import { usePrefs } from "@/hooks";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./AppShell.css";
import { useTabPill } from "./useTabPill";

interface TabBarProps {
  tab: TabId;
  onTab: (tab: TabId) => void;
}

export const TabBar = ({ tab, onTab }: TabBarProps) => {
  const { i18n } = usePrefs();
  const tabListRef = useRef<HTMLElement>(null);
  const [hoverTab, setHoverTab] = useState<TabId | null>(null);

  const { pillStyle, pillNudging } = useTabPill({
    tab,
    hoverTab,
    listRef: tabListRef,
    labels: [i18n.tabInfo, i18n.tabCustom] as const,
  });

  return (
    <nav
      ref={tabListRef}
      className={styles.tabs}
      aria-label="Sections"
      role="tablist"
    >
      <span
        className={styles.tabPill}
        style={pillStyle}
        data-nudge={pillNudging ? "true" : undefined}
        aria-hidden
      />
      <button
        type="button"
        role="tab"
        data-tab-item=""
        aria-selected={tab === "info"}
        aria-controls="tabpanel-info"
        className={cx(styles.tab, tab === "info" && styles.tabActive)}
        onClick={() => onTab("info")}
        onPointerEnter={() => setHoverTab("info")}
        onPointerLeave={() => setHoverTab(null)}
      >
        {i18n.tabInfo}
      </button>
      <button
        type="button"
        role="tab"
        data-tab-item=""
        aria-selected={tab === "custom"}
        aria-controls="tabpanel-custom"
        className={cx(styles.tab, tab === "custom" && styles.tabActive)}
        onClick={() => onTab("custom")}
        onPointerEnter={() => setHoverTab("custom")}
        onPointerLeave={() => setHoverTab(null)}
      >
        {i18n.tabCustom}
      </button>
    </nav>
  );
};
