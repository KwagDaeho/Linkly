import type { TabId } from "@/types";

export const MAIN_TABS: TabId[] = ["trigger", "mouse", "system", "devices"];

export const MAIN_TAB_COUNT = MAIN_TABS.length;

export const mainTabIndex = (tab: TabId): number => {
  const index = MAIN_TABS.indexOf(tab);
  return index >= 0 ? index : 0;
};
