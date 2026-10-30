import { useRef, useState } from "react";
import { EditorHost } from "@/components/editors";
import { ContactFooter } from "@/components/info";
import { AppHeader, BootScreen, OverlayScrollbar } from "@/components/layout";
import { TabSwipePanels } from "./TabSwipePanels";
import { useTabBarSwipe } from "./useTabBarSwipe";
import { CustomTab, InfoTab } from "@/components/tabs";
import { usePrefs, useProfileCtx } from "@/hooks";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./AppShell.css";

export const AppShell = () => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const [tab, setTab] = useState<TabId>("info");
  const tabListRef = useRef<HTMLElement>(null);

  /** Same #root scroll offset across tabs (not per-tab saved positions). */
  const setTabKeepScroll = (next: TabId) => {
    if (next === tab) {
      return;
    }
    const root = document.getElementById("root");
    const scrollTop = root?.scrollTop ?? 0;
    setTab(next);
    if (!root) {
      return;
    }
    const restore = () => {
      root.scrollTop = scrollTop;
    };
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  };

  const tabBar = useTabBarSwipe({
    tab,
    onTab: setTabKeepScroll,
    listRef: tabListRef,
    labels: [i18n.tabInfo, i18n.tabCustom] as const,
  });

  if (!profile) {
    return (
      <>
        <OverlayScrollbar />
        <BootScreen />
      </>
    );
  }
  return (
    <>
      <OverlayScrollbar contentKey={tab} />
      <main className={styles.shell}>
        <AppHeader />

        <nav
          ref={tabListRef}
          className={styles.tabs}
          aria-label="Sections"
          role="tablist"
          data-tab-drag={tabBar.dragging ? "true" : "false"}
          {...tabBar.tabBarHandlers}
        >
          <span
            className={styles.tabPill}
            style={tabBar.pillStyle}
            data-dragging={tabBar.dragging ? "true" : "false"}
            aria-hidden
          />
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            aria-controls="tabpanel-info"
            className={cx(
              styles.tab,
              tabBar.visualTab === "info" && styles.tabActive,
            )}
            onClick={() => {
              if (tabBar.shouldIgnoreClick()) {
                return;
              }
              setTabKeepScroll("info");
            }}
          >
            {i18n.tabInfo}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "custom"}
            aria-controls="tabpanel-custom"
            className={cx(
              styles.tab,
              tabBar.visualTab === "custom" && styles.tabActive,
            )}
            onClick={() => {
              if (tabBar.shouldIgnoreClick()) {
                return;
              }
              setTabKeepScroll("custom");
            }}
          >
            {i18n.tabCustom}
          </button>
        </nav>

        <TabSwipePanels
          active={tab}
          info={<InfoTab />}
          link={<CustomTab />}
        />

        <div className={styles.footerLead}>
          <ContactFooter />
        </div>
        <EditorHost />
      </main>
    </>
  );
};
