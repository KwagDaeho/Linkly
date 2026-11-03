import type {
  ActionCategoryId,
  ActionLetterSubcategoryId,
  CatalogEntry,
  Lang,
} from "@/types";
import { groupCatalogEntries } from "@/domain/actions";
import { categoryLabel, subcategoryLabel as subLabel } from "../translate";

export const subcategoryLabel = subLabel;

export const groupCatalog = (
  lang: Lang,
): {
  id: ActionCategoryId;
  label: string;
  entries: CatalogEntry[];
  subcategories?: {
    id: ActionLetterSubcategoryId;
    label: string;
    entries: CatalogEntry[];
  }[];
}[] => {
  return groupCatalogEntries().map(({ id, entries, subcategories }) => ({
    id,
    label: categoryLabel(id, lang),
    entries,
    subcategories: subcategories?.map((sub) => ({
      id: sub.id,
      label: subLabel(sub.id, lang),
      entries: sub.entries,
    })),
  }));
};
