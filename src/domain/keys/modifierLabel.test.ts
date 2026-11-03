import { describe, expect, it } from "vitest";

import {
  formatSidedModifierIcon,
  formatSidedModifierWord,
} from "@/domain/keys/modifierLabel";
import { formatKeyChord } from "@/i18n/format/keys";

describe("modifierLabel", () => {
  it("uses icon(L/R) for sided modifiers in chords", () => {
    expect(formatSidedModifierIcon("RightMeta")).toBe("⌘(R)");
    expect(formatSidedModifierIcon("LeftOption")).toBe("⌥(L)");
    expect(formatKeyChord(["RightMeta"], "en")).toBe("⌘(R)");
    expect(formatKeyChord(["Meta", "R"], "en")).toBe("⌘+R");
  });

  it("uses command(L/R) in viewer words", () => {
    expect(formatSidedModifierWord("RightMeta", "en")).toBe("command(R)");
    expect(formatSidedModifierWord("LeftShift", "ko")).toBe("shift(L)");
  });
});
