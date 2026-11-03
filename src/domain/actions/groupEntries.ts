import type {
  ActionCategoryId,
  ActionLetterSubcategoryId,
  CatalogEntry,
} from "@/types";
import {
  ACTION_CATEGORY_ORDER,
  LETTER_SUBCATEGORY_ORDER,
} from "@/constants/actionCategories";
import { catalogEntryPickValue } from "./catalogPickValue";
import { ACTION_CATALOG } from "./catalog";

export type CatalogSubcategoryGroup = {
  id: ActionLetterSubcategoryId;
  entries: CatalogEntry[];
};

export type CatalogGroup = {
  id: ActionCategoryId;
  entries: CatalogEntry[];
  subcategories?: CatalogSubcategoryGroup[];
};

const entriesForCategory = (
  map: Map<ActionCategoryId, CatalogEntry[]>,
  categoryId: ActionCategoryId,
): CatalogEntry[] => {
  const entries = map.get(categoryId);
  if (entries === undefined) {
    throw new Error(`Unknown action category: ${categoryId}`);
  }
  return entries;
};

export const groupCatalogEntries = (): CatalogGroup[] => {
  const topLevel = new Map<ActionCategoryId, CatalogEntry[]>();
  const bySub = new Map<
    ActionCategoryId,
    Map<ActionLetterSubcategoryId, CatalogEntry[]>
  >();
  for (const categoryId of ACTION_CATEGORY_ORDER) {
    topLevel.set(categoryId, []);
    bySub.set(categoryId, new Map());
  }

  for (const entry of ACTION_CATALOG) {
    if (entry.subcategory !== undefined) {
      const subMap = bySub.get(entry.category);
      if (subMap === undefined) {
        throw new Error(`Unknown action category: ${entry.category}`);
      }
      const list = subMap.get(entry.subcategory) ?? [];
      list.push(entry);
      subMap.set(entry.subcategory, list);
    } else {
      entriesForCategory(topLevel, entry.category).push(entry);
    }
  }

  return ACTION_CATEGORY_ORDER.map((categoryId) => {
    const subMap = bySub.get(categoryId);
    const subcategories = LETTER_SUBCATEGORY_ORDER.map((subId) => ({
      id: subId,
      entries: subMap?.get(subId) ?? [],
    })).filter((group) => group.entries.length > 0);

    return {
      id: categoryId,
      entries: entriesForCategory(topLevel, categoryId),
      subcategories: subcategories.length > 0 ? subcategories : undefined,
    };
  });
};

export type CatalogSelection = {
  category: ActionCategoryId;
  subcategory?: ActionLetterSubcategoryId;
};

export const findCatalogSelectionForPickValue = (
  pickValue: string,
): CatalogSelection => {
  for (const group of groupCatalogEntries()) {
    for (const entry of group.entries) {
      if (catalogEntryPickValue(entry) === pickValue) {
        return { category: group.id };
      }
    }
    for (const sub of group.subcategories ?? []) {
      for (const entry of sub.entries) {
        if (catalogEntryPickValue(entry) === pickValue) {
          return { category: group.id, subcategory: sub.id };
        }
      }
    }
  }
  return { category: ACTION_CATEGORY_ORDER[0] ?? "basic" };
};
