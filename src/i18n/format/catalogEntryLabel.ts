import type { Lang } from "@/types";
import { catalogModifierLabel } from "@/domain/keys/modifierLabel";
import {
  letterKeyDisplayHint,
} from "@/domain/actions/catalog/buildEntries";

const parseGeneratedEntryId = (
  id: string,
): { kind: string; rest: string } | null => {
  const parts = id.split("_");
  if (parts.length < 2) {
    return null;
  }
  return { kind: parts[0] ?? "", rest: parts.slice(1).join("_") };
};

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
    const letter = id.slice("key_ja_".length);
    const kana = letterKeyDisplayHint("ja", letter);
    if (kana !== undefined) {
      return kana;
    }
    return letter.toUpperCase();
  }
  const parsed = parseGeneratedEntryId(id);
  if (parsed?.kind === "key" && id.startsWith("key_")) {
    return null;
  }
  return null;
};

export const modifierEntryLabel = (id: string, lang: Lang): string | null => {
  return catalogModifierLabel(id, lang);
};

export const editingKeyEntryLabel = (id: string, lang: Lang): string | null => {
  const ko: Record<string, string> = {
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
    key_print_screen: "Print Screen (F13)",
  };
  const en: Record<string, string> = {
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
    key_print_screen: "Print Screen (F13)",
  };
  const table = lang === "ko" ? ko : en;
  return table[id] ?? null;
};

export const arrowEntryLabel = (id: string, lang: Lang): string | null => {
  const ko: Record<string, string> = {
    arrow_left: "← Left",
    arrow_right: "→ Right",
    arrow_up: "↑ Up",
    arrow_down: "↓ Down",
  };
  const en: Record<string, string> = {
    arrow_left: "← Left",
    arrow_right: "→ Right",
    arrow_up: "↑ Up",
    arrow_down: "↓ Down",
  };
  const table = lang === "ko" ? ko : en;
  return table[id] ?? null;
};
