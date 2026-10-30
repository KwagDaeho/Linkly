import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { tabTransitionMs } from "@/components/ui/panelLayout";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./TabSwipePanels.css";

const tabIndex = (tab: TabId): number => (tab === "custom" ? 1 : 0);

interface TabSwipePanelsProps {
  active: TabId;
  info: ReactNode;
  link: ReactNode;
}

export const TabSwipePanels = (props: TabSwipePanelsProps) => {
  const index = tabIndex(props.active);
  const prevIndexRef = useRef(index);
  const [holdPanelHeights, setHoldPanelHeights] = useState(false);

  useLayoutEffect(() => {
    if (prevIndexRef.current === index) {
      return;
    }
    prevIndexRef.current = index;
    setHoldPanelHeights(true);
    const id = window.setTimeout(() => {
      setHoldPanelHeights(false);
    }, tabTransitionMs);
    return () => window.clearTimeout(id);
  }, [index]);

  const offsetPercent = index * 50;
  const expandHeights = holdPanelHeights;

  return (
    <div className={styles.root}>
      <div
        className={styles.track}
        style={{
          transform: `translate3d(-${offsetPercent}%, 0, 0)`,
        }}
      >
        <div
          className={cx(
            styles.page,
            props.active !== "info" && styles.pageInactive,
            !expandHeights &&
              props.active !== "info" &&
              styles.pageCollapsed,
          )}
          role="tabpanel"
          aria-hidden={props.active !== "info"}
          id="tabpanel-info"
        >
          {props.info}
        </div>
        <div
          className={cx(
            styles.page,
            props.active !== "custom" && styles.pageInactive,
            !expandHeights &&
              props.active !== "custom" &&
              styles.pageCollapsed,
          )}
          role="tabpanel"
          aria-hidden={props.active !== "custom"}
          id="tabpanel-custom"
        >
          {props.link}
        </div>
      </div>
    </div>
  );
};
