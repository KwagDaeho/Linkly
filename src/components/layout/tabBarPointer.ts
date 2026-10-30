import { MAIN_TABS } from "@/constants/tabs";
import type { TabId } from "@/types";

export const tabButtonFromPoint = (
  nav: HTMLElement,
  clientX: number,
  clientY: number,
): HTMLButtonElement | null => {
  const hit = document.elementFromPoint(clientX, clientY);
  if (hit === null) {
    return null;
  }
  const button = hit.closest("button[role='tab']");
  if (!(button instanceof HTMLButtonElement) || !nav.contains(button)) {
    return null;
  }
  return button;
};

export const tabIdFromButton = (
  nav: HTMLElement,
  button: HTMLButtonElement,
): TabId | null => {
  const buttons = nav.querySelectorAll<HTMLButtonElement>("button[role='tab']");
  const index = Array.from(buttons).indexOf(button);
  if (index < 0 || index >= MAIN_TABS.length) {
    return null;
  }
  return MAIN_TABS[index] ?? null;
};

export const hoverTabFromPointer = (
  nav: HTMLElement,
  clientX: number,
  clientY: number,
): TabId | null => {
  const button = tabButtonFromPoint(nav, clientX, clientY);
  if (button === null) {
    return null;
  }
  return tabIdFromButton(nav, button);
};
