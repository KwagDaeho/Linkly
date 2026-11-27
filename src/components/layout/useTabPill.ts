import type { RefObject } from "react";

import { mainTabIndex } from "@/constants/tabs";
import type { TabId } from "@/types";

import { useTabsPill } from "./useTabsPill";

interface UseTabPillOptions {
  tab: TabId;
  hoverTab: TabId | null;
  listRef: RefObject<HTMLElement | null>;
}

export const useTabPill = ({ tab, hoverTab, listRef }: UseTabPillOptions) =>
  useTabsPill({
    activeIndex: mainTabIndex(tab),
    hoverIndex: hoverTab === null ? null : mainTabIndex(hoverTab),
    listRef,
  });
