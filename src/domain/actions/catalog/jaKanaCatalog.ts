/**
 * Hiragana action catalog — macOS **Japanese (Kana)** layout (JIS かな).
 *
 * Linkly sends physical key-down events (same model as Karabiner-Elements `to.key_code`),
 * not Unicode paste. The character that appears depends on the active input source.
 *
 * References:
 * - Apple: Japanese keyboard layout — https://support.apple.com/kb/HT284172
 * - JIS kana placement — https://en.wikipedia.org/wiki/Japanese_keyboard_layout
 *
 * **Assumption (SSOT for this catalog):** Input menu → 日本語 → **かな** (not ローマ字).
 * Labels show `kana · keys` so you can verify what Linkly will press.
 */

import type { Lang } from "@/types";

export type JaKanaCatalogRow = {
  kana: string;
  keys: string[];
};

/** ゛ / ゜ on JIS (physical `[` / `]`). */
const DAKUTEN = "[";
const HANDAKUTEN = "]";

/** Seion — Apple JIS かな (US physical key names in `keys`). */
const SEION: JaKanaCatalogRow[] = [
  { kana: "あ", keys: ["3"] },
  { kana: "い", keys: ["E"] },
  { kana: "う", keys: ["4"] },
  { kana: "え", keys: ["5"] },
  { kana: "お", keys: ["6"] },
  { kana: "か", keys: ["T"] },
  { kana: "き", keys: ["G"] },
  { kana: "く", keys: ["H"] },
  { kana: "け", keys: [","] },
  { kana: "こ", keys: ["B"] },
  { kana: "さ", keys: ["X"] },
  { kana: "し", keys: ["D"] },
  { kana: "す", keys: ["R"] },
  { kana: "せ", keys: ["P"] },
  { kana: "そ", keys: ["C"] },
  { kana: "た", keys: ["Q"] },
  { kana: "ち", keys: ["A"] },
  { kana: "つ", keys: ["Z"] },
  { kana: "て", keys: ["W"] },
  { kana: "と", keys: ["S"] },
  { kana: "な", keys: ["U"] },
  { kana: "に", keys: ["I"] },
  { kana: "ぬ", keys: ["1"] },
  { kana: "ね", keys: ["."] },
  { kana: "の", keys: ["K"] },
  { kana: "は", keys: ["F"] },
  { kana: "ひ", keys: ["V"] },
  { kana: "ふ", keys: ["2"] },
  { kana: "へ", keys: ["="] },
  { kana: "ほ", keys: ["-"] },
  { kana: "ま", keys: ["J"] },
  { kana: "み", keys: ["N"] },
  { kana: "む", keys: ["Shift", "/"] },
  { kana: "め", keys: [";"] },
  { kana: "も", keys: ["M"] },
  { kana: "や", keys: ["7"] },
  { kana: "ゆ", keys: ["8"] },
  { kana: "よ", keys: ["9"] },
  { kana: "ら", keys: ["O"] },
  { kana: "り", keys: ["L"] },
  { kana: "る", keys: ["Shift", "."] },
  { kana: "れ", keys: ["'"] },
  { kana: "ろ", keys: ["/"] },
  { kana: "わ", keys: ["0"] },
  { kana: "を", keys: ["Shift", "0"] },
  { kana: "ん", keys: ["Y"] },
  { kana: "っ", keys: ["Shift", "Z"] },
  { kana: "ゃ", keys: ["Shift", "7"] },
  { kana: "ゅ", keys: ["Shift", "8"] },
  { kana: "ょ", keys: ["Shift", "9"] },
];

const VOICED_MAP: Record<string, string> = {
  か: "が",
  き: "ぎ",
  く: "ぐ",
  け: "げ",
  こ: "ご",
  さ: "ざ",
  し: "じ",
  す: "ず",
  せ: "ぜ",
  そ: "ぞ",
  た: "だ",
  ち: "ぢ",
  つ: "づ",
  て: "で",
  と: "ど",
  は: "ば",
  ひ: "び",
  ふ: "ぶ",
  へ: "べ",
  ほ: "ぼ",
};

const SEMI_VOICED_MAP: Record<string, string> = {
  は: "ぱ",
  ひ: "ぴ",
  ふ: "ぷ",
  へ: "ぺ",
  ほ: "ぽ",
};

const withMark = (row: JaKanaCatalogRow, mark: string, kana: string): JaKanaCatalogRow => ({
  kana,
  keys: [...row.keys, mark],
});

const buildJaKanaCatalogRows = (): JaKanaCatalogRow[] => {
  const out: JaKanaCatalogRow[] = [...SEION];
  for (const row of SEION) {
    const voiced = VOICED_MAP[row.kana];
    if (voiced !== undefined) {
      out.push(withMark(row, DAKUTEN, voiced));
    }
    const semi = SEMI_VOICED_MAP[row.kana];
    if (semi !== undefined) {
      out.push(withMark(row, HANDAKUTEN, semi));
    }
  }
  return out;
};

export const JA_KANA_CATALOG_ROWS: JaKanaCatalogRow[] = buildJaKanaCatalogRows();

const JA_KANA_BY_CHAR = new Map(
  JA_KANA_CATALOG_ROWS.map((row) => [row.kana, row] as const),
);

export const jaKanaCatalogRow = (kana: string): JaKanaCatalogRow | undefined =>
  JA_KANA_BY_CHAR.get(kana);

const strokeTokenLabel = (token: string, lang: Lang): string => {
  if (token === "Shift") {
    return "Shift";
  }
  if (token === DAKUTEN) {
    return lang === "ko" ? "濁点" : "゛";
  }
  if (token === HANDAKUTEN) {
    return lang === "ko" ? "半濁点" : "゜";
  }
  if (token.length === 1 && token >= "a" && token <= "z") {
    return token.toUpperCase();
  }
  return token;
};

/** Menu label: hiragana + physical keys Linkly will inject (かな input). */
export const jaKanaCatalogEntryLabel = (
  kana: string,
  keys: string[],
  lang: Lang,
): string => {
  const stroke = keys.map((t) => strokeTokenLabel(t, lang)).join("+");
  return `${kana} · ${stroke}`;
};

export const normalizeJaKanaStrokeKey = (token: string): string => {
  if (token === "Shift") {
    return "Shift";
  }
  if (token.length === 1 && token >= "a" && token <= "z") {
    return token.toUpperCase();
  }
  if (token.length === 1 && token >= "A" && token <= "Z") {
    return token;
  }
  return token;
};
