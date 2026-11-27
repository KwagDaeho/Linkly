import { describe, expect, it } from "vitest";

import { moveItem } from "./dragReorder";

describe("moveItem", () => {
  it("moves an item forward and back", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });
});

describe("applySavedOrder", () => {
  it("orders known ids and keeps new ones at the end", async () => {
    const { applySavedOrder } = await import("./dragReorder");
    expect(applySavedOrder(["a", "b", "c", "d"], ["c", "a"])).toEqual(["c", "a", "b", "d"]);
    expect(applySavedOrder(["a", "b"], ["x", "b"])).toEqual(["b", "a"]);
  });
});
