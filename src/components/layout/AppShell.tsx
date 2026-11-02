import { useState } from "react";
import { EditorHost } from "@/components/editors";
import { AppHeader, BootScreen, OverlayScrollbar } from "@/components/layout";
import { TabBar } from "./TabBar";
import { TabSwipePanels } from "./TabSwipePanels";
import { MouseTab, SystemTab, TriggerTab } from "@/components/tabs";
import { TriggerScopeProvider } from "@/hooks/trigger/TriggerScopeContext";
import { useProfileCtx } from "@/hooks";
import type { TabId } from "@/types";

import * as styles from "./AppShell.css";

export const AppShell = () => {
  const { profile } = useProfileCtx();
  const [tab, setTab] = useState<TabId>("trigger");

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
    <TriggerScopeProvider scope={{ kind: "common" }}>
      <OverlayScrollbar contentKey={tab} />
      <main className={styles.shell}>
        <AppHeader />

        <TabBar tab={tab} onTab={setTabKeepScroll} />

        <TabSwipePanels
          active={tab}
          trigger={<TriggerTab />}
          mouse={<MouseTab />}
          system={<SystemTab />}
        />

        <EditorHost />
      </main>
    </TriggerScopeProvider>
  );
};
