import { useRef, useState } from "react";
import { EditorHost } from "@/components/editors";
import { AppHeader, BootScreen, OverlayScrollbar } from "@/components/layout";
import { TabBar } from "./TabBar";
import { UpdateBanner } from "./UpdateBanner";
import { TabSwipePanels } from "./TabSwipePanels";
import { MouseTab, SystemTab, TriggerTab } from "@/components/tabs";
import { TriggerScopeProvider } from "@/hooks/trigger/TriggerScopeContext";
import { InputDevicesProvider } from "@/hooks/useInputDevices";
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
        <UpdateBanner />

        <TabBar tab={tab} onTab={setTab} />

        <InputDevicesProvider pollEnabled={tab === "trigger"}>
          <TabSwipePanels
            active={tab}
            activeScrollRef={activeTabScrollRef}
            trigger={<TriggerTab active={tab === "trigger"} />}
            mouse={<MouseTab />}
            system={<SystemTab />}
          />
        </InputDevicesProvider>

        <EditorHost />
      </main>
    </TriggerScopeProvider>
  );
};
