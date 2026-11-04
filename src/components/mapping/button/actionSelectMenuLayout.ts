/** Matches `menuRow` minHeight (2rem, border-box) in ActionSelect.css.ts */
export const MENU_CATEGORY_ROW_PX = 32;
export const MENU_GAP_PX = 4;
export const MENU_COL_WIDTH_PX = 168;
/** Menu shell: 1px border top + bottom */
const MENU_BORDER_PX = 2;
const VIEWPORT_PAD_PX = 8;

export interface MenuLayout {
  top: number;
  left: number;
  width: number;
  height: number;
  columnCount: 2 | 3;
}

export const menuColumnCount = (
  hasSubcategories: boolean,
  letterSubcategorySelected: boolean,
): 2 | 3 =>
  hasSubcategories && letterSubcategorySelected ? 3 : 2;

/** Fallback before DOM measure: 1st-depth category list natural height. */
export const firstColumnContentHeightPx = (categoryCount: number): number =>
  categoryCount * MENU_CATEGORY_ROW_PX + MENU_BORDER_PX;

/** Read rendered 1dep list height from an open menu (SSOT when available). */
export const measureCategoryColumnHeightPx = (
  menuRoot: HTMLElement,
): number | null => {
  const list = menuRoot.querySelector("[data-action-select-category-list]");
  if (!(list instanceof HTMLElement)) {
    return null;
  }
  let sum = 0;
  for (const child of list.children) {
    if (child instanceof HTMLElement) {
      sum += child.offsetHeight;
    }
  }
  if (sum <= 0) {
    return null;
  }
  return sum + MENU_BORDER_PX;
};

export const resolveOneDepHeightPx = (
  menuRoot: HTMLElement | null,
  categoryCount: number,
): number => {
  if (menuRoot !== null) {
    const measured = measureCategoryColumnHeightPx(menuRoot);
    if (measured !== null) {
      return measured;
    }
  }
  return firstColumnContentHeightPx(categoryCount);
};

const scrollportForTrigger = (trigger: HTMLElement): HTMLElement | null => {
  const tab = trigger.closest("[data-tab-scrollport]");
  if (tab instanceof HTMLElement) {
    return tab;
  }
  let node: HTMLElement | null = trigger.parentElement;
  while (node !== null) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const anchorRectForTrigger = (trigger: HTMLElement): DOMRect => {
  const scrollport = scrollportForTrigger(trigger);
  if (scrollport !== null) {
    return scrollport.getBoundingClientRect();
  }
  return new DOMRect(
    VIEWPORT_PAD_PX,
    VIEWPORT_PAD_PX,
    window.innerWidth - VIEWPORT_PAD_PX * 2,
    window.innerHeight - VIEWPORT_PAD_PX * 2,
  );
};

/** Fixed `position: menu` — use the window viewport, not the tab scrollport clip. */
const verticalSpaceAround = (
  trigger: HTMLElement,
): { spaceBelow: number; spaceAbove: number } => {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow =
    window.innerHeight - rect.bottom - VIEWPORT_PAD_PX - MENU_GAP_PX;
  const spaceAbove = rect.top - VIEWPORT_PAD_PX - MENU_GAP_PX;

  return {
    spaceBelow: Math.max(0, spaceBelow),
    spaceAbove: Math.max(0, spaceAbove),
  };
};

/**
 * Up vs down (fixed menu, window viewport for fit):
 * 1. Full 1dep fits only below → down
 * 2. Full 1dep fits only above → up
 * 3. Full 1dep fits both → tab scrollport vertical center: upper half up, lower half down
 * 4. Neither side fits full 1dep → side with more space (tie → down); height is clamped + column scroll
 */
export const chooseMenuOpenBelow = (
  triggerRect: Pick<DOMRect, "top" | "bottom">,
  spaceBelow: number,
  spaceAbove: number,
  menuHeight: number,
  anchorRect: Pick<DOMRect, "top" | "bottom">,
): boolean => {
  const fitsBelow = spaceBelow >= menuHeight;
  const fitsAbove = spaceAbove >= menuHeight;

  if (fitsBelow && !fitsAbove) {
    return true;
  }
  if (fitsAbove && !fitsBelow) {
    return false;
  }
  if (fitsBelow && fitsAbove) {
    const triggerMid = (triggerRect.top + triggerRect.bottom) / 2;
    const anchorMid = (anchorRect.top + anchorRect.bottom) / 2;
    return triggerMid >= anchorMid;
  }

  return spaceBelow >= spaceAbove;
};

export const layoutActionSelectMenu = (
  trigger: HTMLButtonElement,
  columnCount: 2 | 3,
  anchorLeft: number | null,
  oneDepHeightPx: number,
): MenuLayout => {
  const rect = trigger.getBoundingClientRect();
  const width = columnCount * MENU_COL_WIDTH_PX;
  const menuHeight = Math.max(1, oneDepHeightPx);
  const { spaceBelow, spaceAbove } = verticalSpaceAround(trigger);
  const anchorRect = anchorRectForTrigger(trigger);
  const openBelow = chooseMenuOpenBelow(
    rect,
    spaceBelow,
    spaceAbove,
    menuHeight,
    anchorRect,
  );

  const available = openBelow ? spaceBelow : spaceAbove;
  const height = Math.min(menuHeight, available);

  const top = openBelow
    ? rect.bottom + MENU_GAP_PX
    : Math.max(VIEWPORT_PAD_PX, rect.top - MENU_GAP_PX - height);

  let left = anchorLeft ?? rect.left;
  if (left + width > window.innerWidth - VIEWPORT_PAD_PX) {
    left = Math.max(
      VIEWPORT_PAD_PX,
      window.innerWidth - width - VIEWPORT_PAD_PX,
    );
  }
  if (left < VIEWPORT_PAD_PX) {
    left = VIEWPORT_PAD_PX;
  }

  return { top, left, width, height, columnCount };
};
