import { useState } from "react";
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

        <nav className={styles.tabs} aria-label="Sections" role="tablist">
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

        <ContactFooter />
        <EditorHost />
      </main>
    </>
  );
};
