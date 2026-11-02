import { MAIN_TABS, mainTabIndex } from "@/constants/tabs";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";
import type { ReactNode } from "react";

import * as styles from "./TabSwipePanels.css";

interface TabSwipePanelsProps {
  active: TabId;
  trigger: ReactNode;
  mouse: ReactNode;
  system: ReactNode;
}

const panelContent: Record<TabId, keyof TabSwipePanelsProps> = {
  trigger: "trigger",
  mouse: "mouse",
  system: "system",
};

export const TabSwipePanels = (props: TabSwipePanelsProps) => {
  const index = mainTabIndex(props.active);
  const offsetPercent = index * (100 / MAIN_TABS.length);

  return (
    <div className={styles.root}>
      <div
        className={styles.track}
        style={{
          transform: `translate3d(-${offsetPercent}%, 0, 0)`,
        }}
      >
        {MAIN_TABS.map((id) => {
          const active = props.active === id;
          return (
            <div
              key={id}
              className={cx(
                styles.page,
                !active && styles.pageInactive,
                !active && styles.pageCollapsed,
              )}
              role="tabpanel"
              aria-hidden={!active}
              id={`tabpanel-${id}`}
            >
              {active ? props[panelContent[id]] : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
