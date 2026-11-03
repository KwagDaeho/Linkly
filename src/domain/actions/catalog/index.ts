import type { CatalogEntry } from "@/types";

import { buildGeneratedCatalogEntries } from "./buildEntries";
import { STATIC_CATALOG_ENTRIES } from "./staticEntries";

export const ACTION_CATALOG: CatalogEntry[] = [
  ...STATIC_CATALOG_ENTRIES,
  ...buildGeneratedCatalogEntries(),
];
