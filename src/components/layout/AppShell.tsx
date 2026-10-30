import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { EditorHost } from "@/components/editors";
import { ContactFooter } from "@/components/info";
import { AppHeader, BootScreen, OverlayScrollbar } from "@/components/layout";
import { TabSwipePanels } from "./TabSwipePanels";
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
  const [pillStyle, setPillStyle] = useState<CSSProperties>({
    opacity: 0,
  });

  /** Align pill box to the active tab button. */
  const syncTabPill = useCallback(() => {
    const list = tabListRef.current;
    if (list === null) {
      return;
    }
    const buttons = list.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const index = tab === "custom" ? 1 : 0;
    const activeBtn = buttons.item(index);
    if (activeBtn === null) {
      return;
    }
    setPillStyle({
      left: activeBtn.offsetLeft,
      top: activeBtn.offsetTop,
      width: activeBtn.offsetWidth,
      height: activeBtn.offsetHeight,
      opacity: 1,
    });
  }, [tab]);

  useLayoutEffect(() => {
    syncTabPill();
  }, [syncTabPill, i18n.tabInfo, i18n.tabCustom]);

  useLayoutEffect(() => {
    const list = tabListRef.current;
    if (list === null) {
      return;
    }
    const observer = new ResizeObserver(syncTabPill);
    observer.observe(list);
    return () => observer.disconnect();
  }, [syncTabPill]);

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
        >
          <span className={styles.tabPill} style={pillStyle} aria-hidden />
          <button
            type="button"
            role="tab"
            aria-selected={tab === "info"}
            aria-controls="tabpanel-info"
            className={cx(styles.tab, tab === "info" && styles.tabActive)}
            onClick={() => setTabKeepScroll("info")}
          >
            {i18n.tabInfo}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "custom"}
            aria-controls="tabpanel-custom"
            className={cx(styles.tab, tab === "custom" && styles.tabActive)}
            onClick={() => setTabKeepScroll("custom")}
          >
            {i18n.tabCustom}
          </button>
        </nav>

        <TabSwipePanels
          active={tab}
          onActiveChange={setTabKeepScroll}
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
