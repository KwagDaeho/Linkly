import type { ActionCategoryId, ActionLetterSubcategoryId } from "@/types";

export const ACTION_CATEGORY_ORDER: ActionCategoryId[] = [
  "basic",
  "modifiers",
  "editing",
  "function_keys",
  "mouse",
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

/** macOS inject + key map (see keyboard.rs `function_key_code`). */
export const FUNCTION_KEY_CATALOG_MAX = 20;

/** Karabiner-style Button6… (CG `Other` uses number = karabiner − 1). */
export const MOUSE_EXTRA_BUTTON_MIN = 6;
/** Practical HID / gaming-mice upper bound (Button32). */
export const MOUSE_EXTRA_BUTTON_MAX = 32;
