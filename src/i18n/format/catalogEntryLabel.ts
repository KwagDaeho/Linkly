import type { Lang } from "@/types";
import { letterKeyDisplayHint } from "@/domain/actions/catalog/buildEntries";
import {
  jaKanaCatalogEntryLabel,
  jaKanaCatalogRow,
} from "@/domain/actions/catalog/jaKanaCatalog";

export const resolveGeneratedEntryLabel = (
  id: string,
  lang: Lang,
): string | null => {
  if (id.startsWith("fkey_")) {
    const n = id.slice("fkey_".length);
    return `F${n}`;
  }
  if (id.startsWith("mouse_btn_")) {
    const n = id.slice("mouse_btn_".length);
    return lang === "ko" ? `마우스 버튼 ${n}` : `Mouse button ${n}`;
  }
  if (id.startsWith("mod_")) {
    return null;
  }
  if (id.startsWith("key_digit_")) {
    return id.slice("key_digit_".length);
  }
  if (id.startsWith("key_en_")) {
    return id.slice("key_en_".length).toUpperCase();
  }
  if (id.startsWith("key_ko_")) {
    const letter = id.slice("key_ko_".length);
    const hangul = letterKeyDisplayHint("ko", letter);
    if (hangul !== undefined) {
      return hangul;
    }
    return letter.toUpperCase();
  }
  if (id.startsWith("key_ja_")) {
    const rest = id.slice("key_ja_".length);
    const row = jaKanaCatalogRow(rest);
    if (row !== undefined) {
      return jaKanaCatalogEntryLabel(row.kana, row.keys, lang);
    }
    const kana = letterKeyDisplayHint("ja", rest);
    if (kana !== undefined) {
      return kana;
    }
    return rest.toUpperCase();
  }
  return null;
};

/** Same text in every language. */
const EDITING_KEY_LABELS: Record<string, string> = {
  key_space: "Space",
  key_tab: "Tab",
  key_return: "Return / Enter",
  key_escape: "Esc",
  key_delete: "Delete (Backspace)",
  key_forward_delete: "Forward Delete",
  key_insert: "Insert",
  key_home: "Home",
  key_end: "End",
  key_page_up: "Page Up",
  key_page_down: "Page Down",
  key_help: "Help",
  key_clear: "Clear",
  key_caps_lock: "Caps Lock",
};

const ARROW_LABELS: Record<string, string> = {
  arrow_left: "← Left",
  arrow_right: "→ Right",
  arrow_up: "↑ Up",
  arrow_down: "↓ Down",
};

export const editingKeyEntryLabel = (id: string): string | null =>
  EDITING_KEY_LABELS[id] ?? null;

export const arrowEntryLabel = (id: string): string | null =>
  ARROW_LABELS[id] ?? null;
