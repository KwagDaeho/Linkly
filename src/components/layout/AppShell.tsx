import { useState } from "react";
import { EditorHost } from "@/components/editors";
import { ContactFooter } from "@/components/info";
import { AppHeader, BootScreen, OverlayScrollbar } from "@/components/layout";
import { TabBar } from "./TabBar";
import { TabSwipePanels } from "./TabSwipePanels";
import { CustomTab, InfoTab } from "@/components/tabs";
import { useProfileCtx } from "@/hooks";
import type { TabId } from "@/types";

import * as styles from "./AppShell.css";

export const AppShell = () => {
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

        <TabBar tab={tab} onTab={setTabKeepScroll} />

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
