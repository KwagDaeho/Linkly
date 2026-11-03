import { describe, expect, it } from "vitest";

import { groupCatalogEntries } from "@/domain/actions";

describe("groupCatalogEntries", () => {
  it("splits letter keys into en/ko/ja subcategories", () => {
    const letters = groupCatalogEntries().find((g) => g.id === "letters");
    expect(letters).toBeDefined();
    expect(letters?.entries).toHaveLength(0);
    expect(letters?.subcategories?.map((s) => s.id)).toEqual(["en", "ko", "ja"]);
    expect(letters?.subcategories?.[0]?.entries.length).toBeGreaterThan(20);
  });

  it("includes function keys through F200", () => {
    const fkeys = groupCatalogEntries().find((g) => g.id === "function_keys");
    expect(fkeys?.entries.some((e) => e.id === "fkey_1")).toBe(true);
    expect(fkeys?.entries.some((e) => e.id === "fkey_200")).toBe(true);
  });

  it("includes mouse buttons through 30", () => {
    const buttons = groupCatalogEntries().find((g) => g.id === "mouse_buttons");
    expect(buttons?.entries.some((e) => e.id === "mouse_btn_30")).toBe(true);
  });
});
