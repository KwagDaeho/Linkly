import { MAIN_TABS, mainTabIndex } from "@/constants/tabs";
import { tabTransitionMs } from "@/components/ui/panelLayout";
import type { TabId } from "@/types";
import { cx } from "@/utils/cx";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import * as styles from "./TabSwipePanels.css";

interface TabSwipePanelsProps {
  active: TabId;
  /** Scrollport for the active tab (overlay scrollbar + overflow auto). */
  activeScrollRef?: RefObject<HTMLDivElement | null>;
  trigger: ReactNode;
  mouse: ReactNode;
  system: ReactNode;
}

const panelContent: Record<TabId, "trigger" | "mouse" | "system"> = {
  trigger: "trigger",
  mouse: "mouse",
  system: "system",
};

const tabSettleMs = (): number => {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return 0;
  }
  return tabTransitionMs;
};

/** Outgoing tab keeps overflow auto until the slide finishes; incoming gets auto immediately. */
const useOutgoingScrollAuto = (active: TabId): TabId | null => {
  const [outgoing, setOutgoing] = useState<TabId | null>(null);
  const prevActiveRef = useRef(active);

  useEffect(() => {
    const prev = prevActiveRef.current;
    if (prev === active) {
      return;
    }
    prevActiveRef.current = active;
    setOutgoing(prev);
    const timer = window.setTimeout(() => {
      setOutgoing((current) => (current === prev ? null : current));
    }, tabSettleMs());
    return () => window.clearTimeout(timer);
  }, [active]);

  return outgoing;
};

export const TabSwipePanels = (props: TabSwipePanelsProps) => {
  const outgoingScrollAuto = useOutgoingScrollAuto(props.active);
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
          const isActive = props.active === id;
          const scrollAuto =
            isActive || (outgoingScrollAuto !== null && id === outgoingScrollAuto);
          return (
            <div
              key={id}
              ref={isActive ? props.activeScrollRef : undefined}
              className={cx(
                styles.page,
                scrollAuto ? styles.pageScrollAuto : styles.pageScrollVisible,
                !isActive && styles.pageNonInteractive,
              )}
              data-tab-scrollport=""
              role="tabpanel"
              aria-hidden={!isActive}
              id={`tabpanel-${id}`}
            >
              {props[panelContent[id]]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
