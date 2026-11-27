import type { ActionCategoryId, ActionLetterSubcategoryId, Dict, Lang } from "@/types";

import { catalogModifierLabel } from "@/domain/keys/modifierLabel";
import {
  arrowEntryLabel,
  editingKeyEntryLabel,
  resolveGeneratedEntryLabel,
} from "./format/catalogEntryLabel";
import { en } from "./locales/en";
import { ko } from "./locales/ko";

const STRINGS = {
  ko,
  en,
} as const;

export const t = (lang: Lang): Dict => {
  return STRINGS[lang] as Dict;
};

export const buttonLabel = (id: string, lang: Lang): string => {
  const labels = t(lang).buttons as Record<string, string>;
  if (id in labels) {
    return labels[id];
  }
  return id;
};

export const entryLabel = (id: string, lang: Lang): string => {
  const generated =
    catalogModifierLabel(id) ??
    editingKeyEntryLabel(id) ??
    arrowEntryLabel(id) ??
    resolveGeneratedEntryLabel(id, lang);
  if (generated !== null) {
    return generated;
  }
  const labels = t(lang).entries as Record<string, string>;
  if (id in labels) {
    return labels[id];
  }
  return id;
};

export const categoryLabel = (id: ActionCategoryId, lang: Lang): string => {
  return t(lang).categories[id];
};

export const subcategoryLabel = (
  id: ActionLetterSubcategoryId,
  lang: Lang,
): string => {
  return t(lang).subcategories[id];
};
