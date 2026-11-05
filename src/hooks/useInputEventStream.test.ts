import { describe, expect, it } from "vitest";

import type { InputEventLine } from "@/types";

const MAX_PENDING = 400;

const pushPending = (
  pending: InputEventLine[],
  line: InputEventLine,
): InputEventLine[] => {
  const next = [...pending, line];
  if (next.length <= MAX_PENDING) {
    return next;
  }
  return next.slice(next.length - MAX_PENDING);
};

const line = (n: number): InputEventLine => ({
  tsMs: n,
  source: "os",
  kind: "mouseMoved",
  summary: `cursor (${n},0)`,
  detail: `cursor (${n},0)`,
});

describe("input event pending cap", () => {
  it("keeps at most MAX_PENDING lines", () => {
    let pending: InputEventLine[] = [];
    for (let i = 0; i < 10_000; i++) {
      pending = pushPending(pending, line(i));
    }
    expect(pending).toHaveLength(MAX_PENDING);
    expect(pending[0]?.tsMs).toBe(10_000 - MAX_PENDING);
    expect(pending[pending.length - 1]?.tsMs).toBe(9_999);
  });
});
