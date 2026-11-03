import type { CatalogEntry } from "@/types";
import {
  CUSTOM_KEY_SENTINEL,
  MACRO_SENTINEL,
  OPEN_APP_SENTINEL,
} from "@/constants/sentinels";
import { actionKey } from "@/domain/profile";

/** `<select>` value for one catalog row (SSOT with ActionSelect). */
export const catalogEntryPickValue = (entry: CatalogEntry): string => {
  if (entry.special === "custom_key") {
    return CUSTOM_KEY_SENTINEL;
  }
  if (entry.special === "macro") {
    return MACRO_SENTINEL;
  }
  if (entry.special === "open_app") {
    return OPEN_APP_SENTINEL;
  }
  return actionKey(entry.action);
};
