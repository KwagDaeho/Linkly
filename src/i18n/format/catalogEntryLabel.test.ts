import { describe, expect, it } from "vitest";

import { resolveGeneratedEntryLabel } from "./catalogEntryLabel";

describe("resolveGeneratedEntryLabel letter keys", () => {
  it("shows hangul/kana only without Latin suffix", () => {
    expect(resolveGeneratedEntryLabel("key_ko_q", "ko")).toBe("ㅂ");
    expect(resolveGeneratedEntryLabel("key_ko_q", "en")).toBe("ㅂ");
    expect(resolveGeneratedEntryLabel("key_ja_q", "ko")).toBe("た");
    expect(resolveGeneratedEntryLabel("key_en_q", "ko")).toBe("Q");
  });
});
