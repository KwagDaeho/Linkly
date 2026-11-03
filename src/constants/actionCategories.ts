import type { ActionCategoryId, ActionLetterSubcategoryId } from "@/types";

export const ACTION_CATEGORY_ORDER: ActionCategoryId[] = [
  "basic",
  "modifiers",
  "editing",
  "arrows",
  "function_keys",
  "mouse_buttons",
  "mouse_actions",
  "letters",
  "browser",
  "edit",
  "system",
  "media",
  "launch",
  "custom",
];

export const LETTER_SUBCATEGORY_ORDER: ActionLetterSubcategoryId[] = [
  "en",
  "ko",
  "ja",
];

/** Inclusive — macOS exposes F1–F24 in our key map; F25+ use keycode tokens. */
export const FUNCTION_KEY_MAC_MAX = 24;
export const FUNCTION_KEY_CATALOG_MAX = 200;

export const MOUSE_EXTRA_BUTTON_MIN = 6;
export const MOUSE_EXTRA_BUTTON_MAX = 30;
