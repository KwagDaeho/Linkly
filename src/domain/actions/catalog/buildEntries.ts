import {
  FUNCTION_KEY_CATALOG_MAX,
  MOUSE_EXTRA_BUTTON_MAX,
  MOUSE_EXTRA_BUTTON_MIN,
} from "@/constants/actionCategories";
import type { ActionLetterSubcategoryId, CatalogEntry } from "@/types";

const EN_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

/** Two-set Korean (Dubeolsik) labels on US QWERTY positions. */
export const KO_KEY_LABEL: Record<string, string> = {
  q: "ㅂ",
  w: "ㅈ",
  e: "ㄷ",
  r: "ㄱ",
  t: "ㅅ",
  y: "ㅛ",
  u: "ㅕ",
  i: "ㅑ",
  o: "ㅐ",
  p: "ㅔ",
  a: "ㅁ",
  s: "ㄴ",
  d: "ㅇ",
  f: "ㄹ",
  g: "ㅎ",
  h: "ㅗ",
  j: "ㅓ",
  k: "ㅏ",
  l: "ㅣ",
  z: "ㅋ",
  x: "ㅌ",
  c: "ㅊ",
  v: "ㅍ",
  b: "ㅠ",
  n: "ㅜ",
  m: "ㅡ",
};

/** Hiragana on typical JIS/US-mapped letter keys (display only). */
export const JA_KEY_LABEL: Record<string, string> = {
  q: "た",
  w: "て",
  e: "い",
  r: "す",
  t: "か",
  y: "ん",
  u: "な",
  i: "に",
  o: "ら",
  p: "せ",
  a: "ち",
  s: "と",
  d: "し",
  f: "は",
  g: "き",
  h: "く",
  j: "ま",
  k: "の",
  l: "り",
  z: "つ",
  x: "さ",
  c: "そ",
  v: "ひ",
  b: "こ",
  n: "み",
  m: "も",
};

const QWERTY_PHYSICAL = "qwertyuiopasdfghjklzxcvbnm".split("");

const sortedPhysicalForSubcategory = (
  subcategory: ActionLetterSubcategoryId,
): string[] => {
  if (subcategory === "en") {
    return EN_LETTERS;
  }
  if (subcategory === "ko") {
    return [...QWERTY_PHYSICAL].sort((a, b) => {
      const ha = KO_KEY_LABEL[a] ?? a;
      const hb = KO_KEY_LABEL[b] ?? b;
      return ha.localeCompare(hb, "ko");
    });
  }
  return [...QWERTY_PHYSICAL].sort((a, b) => {
    const ha = JA_KEY_LABEL[a] ?? a;
    const hb = JA_KEY_LABEL[b] ?? b;
    return ha.localeCompare(hb, "ja");
  });
};

const modifierEntries = (): CatalogEntry[] => {
  const side: { id: string; key: string }[] = [
    { id: "mod_left_command", key: "LeftMeta" },
    { id: "mod_right_command", key: "RightMeta" },
    { id: "mod_left_shift", key: "LeftShift" },
    { id: "mod_right_shift", key: "RightShift" },
    { id: "mod_left_option", key: "LeftOption" },
    { id: "mod_right_option", key: "RightOption" },
    { id: "mod_left_control", key: "LeftControl" },
    { id: "mod_right_control", key: "RightControl" },
    { id: "mod_fn", key: "Fn" },
  ];
  return side.map(({ id, key }) => ({
    id,
    category: "modifiers" as const,
    action: { type: "key_stroke" as const, keys: [key] },
  }));
};

const editingEntries = (): CatalogEntry[] => {
  const keys: { id: string; stroke: string[] }[] = [
    { id: "key_space", stroke: ["Space"] },
    { id: "key_tab", stroke: ["Tab"] },
    { id: "key_return", stroke: ["Return"] },
    { id: "key_escape", stroke: ["Escape"] },
    { id: "key_delete", stroke: ["Delete"] },
    { id: "key_forward_delete", stroke: ["ForwardDelete"] },
    { id: "key_insert", stroke: ["Insert"] },
    { id: "key_home", stroke: ["Home"] },
    { id: "key_end", stroke: ["End"] },
    { id: "key_page_up", stroke: ["PageUp"] },
    { id: "key_page_down", stroke: ["PageDown"] },
    { id: "key_help", stroke: ["Help"] },
    { id: "key_clear", stroke: ["Clear"] },
    { id: "key_caps_lock", stroke: ["CapsLock"] },
    { id: "key_print_screen", stroke: ["F13"] },
    { id: "arrow_left", stroke: ["Left"] },
    { id: "arrow_right", stroke: ["Right"] },
    { id: "arrow_up", stroke: ["Up"] },
    { id: "arrow_down", stroke: ["Down"] },
  ];
  return keys.map(({ id, stroke }) => ({
    id,
    category: "editing" as const,
    action: { type: "key_stroke" as const, keys: stroke },
  }));
};

const functionKeyEntries = (): CatalogEntry[] => {
  const out: CatalogEntry[] = [];
  for (let n = 1; n <= FUNCTION_KEY_CATALOG_MAX; n += 1) {
    out.push({
      id: `fkey_${n}`,
      category: "function_keys",
      action: { type: "key_stroke", keys: [`F${n}`] },
    });
  }
  return out;
};

const mouseEntries = (): CatalogEntry[] => {
  const standard: CatalogEntry[] = [
    {
      id: "mouse_left",
      category: "mouse",
      action: { type: "mouse_click", button: "left" },
    },
    {
      id: "mouse_right",
      category: "mouse",
      action: { type: "mouse_click", button: "right" },
    },
    {
      id: "mouse_middle",
      category: "mouse",
      action: { type: "mouse_click", button: "middle" },
    },
    {
      id: "mouse_back",
      category: "mouse",
      action: { type: "mouse_click", button: "back" },
    },
    {
      id: "mouse_forward",
      category: "mouse",
      action: { type: "mouse_click", button: "forward" },
    },
    { id: "double_click", category: "mouse", action: { type: "double_click" } },
    {
      id: "scroll_left",
      category: "mouse",
      action: { type: "scroll", dx: -3, dy: 0 },
    },
    {
      id: "scroll_right",
      category: "mouse",
      action: { type: "scroll", dx: 3, dy: 0 },
    },
    {
      id: "scroll_up",
      category: "mouse",
      action: { type: "scroll", dx: 0, dy: 3 },
    },
    {
      id: "scroll_down",
      category: "mouse",
      action: { type: "scroll", dx: 0, dy: -3 },
    },
  ];
  const extra: CatalogEntry[] = [];
  for (let n = MOUSE_EXTRA_BUTTON_MIN; n <= MOUSE_EXTRA_BUTTON_MAX; n += 1) {
    extra.push({
      id: `mouse_btn_${n}`,
      category: "mouse",
      action: { type: "key_stroke", keys: [`Button${n}`] },
    });
  }
  return [...standard, ...extra];
};

const letterEntriesFor = (
  subcategory: ActionLetterSubcategoryId,
): CatalogEntry[] => {
  return sortedPhysicalForSubcategory(subcategory).map((letter) => ({
    id: `key_${subcategory}_${letter}`,
    category: "letters" as const,
    subcategory,
    action: {
      type: "key_stroke" as const,
      keys: [letter.toUpperCase()],
    },
  }));
};

export const buildGeneratedCatalogEntries = (): CatalogEntry[] => {
  return [
    ...modifierEntries(),
    ...editingEntries(),
    ...functionKeyEntries(),
    ...mouseEntries(),
    ...letterEntriesFor("en"),
    ...letterEntriesFor("ko"),
    ...letterEntriesFor("ja"),
  ];
};

export const letterKeyDisplayHint = (
  subcategory: ActionLetterSubcategoryId,
  letter: string,
): string | undefined => {
  const lower = letter.toLowerCase();
  if (subcategory === "ko") {
    return KO_KEY_LABEL[lower];
  }
  if (subcategory === "ja") {
    return JA_KEY_LABEL[lower];
  }
  return undefined;
};
