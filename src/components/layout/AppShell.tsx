import { useRef, useState } from "react";
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
  const [tab, setTab] = useState<TabId>("system");
  const activeTabScrollRef = useRef<HTMLDivElement | null>(null);

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
      <OverlayScrollbar contentKey={tab} scrollRef={activeTabScrollRef} />
      <main className={styles.shell}>
        <AppHeader />

        <TabBar tab={tab} onTab={setTab} />

        <TabSwipePanels
          active={tab}
          activeScrollRef={activeTabScrollRef}
          trigger={<TriggerTab />}
          mouse={<MouseTab />}
          system={<SystemTab />}
        />

        <EditorHost />
      </main>
    </TriggerScopeProvider>
  );
};
