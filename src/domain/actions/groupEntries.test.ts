import { describe, expect, it } from "vitest";

import { groupCatalogEntries } from "@/domain/actions";
import { letterKeyDisplayHint } from "@/domain/actions/catalog/buildEntries";

describe("groupCatalogEntries", () => {
  it("splits letter keys into en/ko/ja subcategories", () => {
    const letters = groupCatalogEntries().find((g) => g.id === "letters");
    expect(letters).toBeDefined();
    expect(letters?.entries).toHaveLength(0);
    expect(letters?.subcategories?.map((s) => s.id)).toEqual(["en", "ko", "ja"]);
    expect(letters?.subcategories?.[0]?.entries.length).toBeGreaterThan(20);
  });

  it("sorts English letters A–Z", () => {
    const en = groupCatalogEntries()
      .find((g) => g.id === "letters")
      ?.subcategories?.find((s) => s.id === "en")?.entries;
    const letters = en?.map((e) => e.id.replace("key_en_", "")).join("");
    expect(letters).toBe("abcdefghijklmnopqrstuvwxyz");
  });

  it("sorts Korean letters in 가나다 order", () => {
    const ko = groupCatalogEntries()
      .find((g) => g.id === "letters")
      ?.subcategories?.find((s) => s.id === "ko")?.entries;
    const hangul =
      ko?.map((e) => {
        const ch = e.id.replace("key_ko_", "");
        return letterKeyDisplayHint("ko", ch) ?? ch;
      }) ?? [];
    const sorted = [...hangul].sort((a, b) => a.localeCompare(b, "ko"));
    expect(hangul).toEqual(sorted);
  });

  it("includes injectable function keys F1–F20 only", () => {
    const fkeys = groupCatalogEntries().find((g) => g.id === "function_keys");
    expect(fkeys?.entries.some((e) => e.id === "fkey_1")).toBe(true);
    expect(fkeys?.entries.some((e) => e.id === "fkey_20")).toBe(true);
    expect(fkeys?.entries.some((e) => e.id === "fkey_21")).toBe(false);
  });

  it("merges mouse clicks, scroll, and extra buttons", () => {
    const mouse = groupCatalogEntries().find((g) => g.id === "mouse");
    expect(mouse?.entries.some((e) => e.id === "mouse_left")).toBe(true);
    expect(mouse?.entries.some((e) => e.id === "double_click")).toBe(true);
    expect(mouse?.entries.some((e) => e.id === "mouse_btn_32")).toBe(true);
    expect(mouse?.entries.some((e) => e.id === "mouse_btn_33")).toBe(false);
  });
});
