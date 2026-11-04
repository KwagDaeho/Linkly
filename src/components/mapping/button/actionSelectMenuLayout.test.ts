import { describe, expect, it } from "vitest";

import { ACTION_CATEGORY_ORDER } from "@/constants/actionCategories";

import {
  chooseMenuOpenBelow,
  firstColumnContentHeightPx,
  MENU_CATEGORY_ROW_PX,
} from "./actionSelectMenuLayout";

const categoryCount = ACTION_CATEGORY_ORDER.length;

describe("actionSelectMenuLayout", () => {
  it("menu height follows 1dep row count (2rem rows + menu border)", () => {
    expect(firstColumnContentHeightPx(categoryCount)).toBe(
      categoryCount * MENU_CATEGORY_ROW_PX + 2,
    );
  });

  it("opens downward when only below fits full 1dep (e.g. top row RB)", () => {
    const triggerRect = { top: 120, bottom: 152 };
    const anchorRect = { top: 80, bottom: 680 };
    const menuHeight = firstColumnContentHeightPx(categoryCount);

    const openBelow = chooseMenuOpenBelow(
      triggerRect,
      menuHeight + 200,
      menuHeight - 80,
      menuHeight,
      anchorRect,
    );

    expect(openBelow).toBe(true);
  });

  it("opens upward in upper tab half when both sides fit full 1dep", () => {
    const triggerRect = { top: 200, bottom: 232 };
    const anchorRect = { top: 80, bottom: 680 };
    const menuHeight = firstColumnContentHeightPx(categoryCount);

    const openBelow = chooseMenuOpenBelow(
      triggerRect,
      menuHeight + 400,
      menuHeight + 200,
      menuHeight,
      anchorRect,
    );

    expect(openBelow).toBe(false);
  });

  it("opens downward in lower tab half when both sides fit full 1dep", () => {
    const triggerRect = { top: 520, bottom: 552 };
    const anchorRect = { top: 80, bottom: 680 };
    const menuHeight = firstColumnContentHeightPx(categoryCount);

    const openBelow = chooseMenuOpenBelow(
      triggerRect,
      menuHeight + 40,
      menuHeight + 40,
      menuHeight,
      anchorRect,
    );

    expect(openBelow).toBe(true);
  });
});
