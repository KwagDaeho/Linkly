import { describe, expect, it } from "vitest";

import {
  activatorsEqual,
  comboEffectiveTrigger,
  comboWithTrigger,
} from "./activator";

describe("comboEffectiveTrigger", () => {
  it("prefers explicit trigger over legacy device button", () => {
    const combo = comboWithTrigger(["Meta"], ["K"], {
      type: "mouse",
      button: { type: "other", number: 56 },
    });
    expect(comboEffectiveTrigger(combo)).toEqual({
      type: "mouse",
      button: { type: "other", number: 56 },
    });
  });

  it("falls back to legacy device button", () => {
    expect(
      comboEffectiveTrigger({ modifiers: [], keys: ["K"], button: "fn1" }),
    ).toEqual({ type: "huge", button: "fn1" });
  });
});

describe("activatorsEqual", () => {
  it("matches mouse button numbers", () => {
    expect(
      activatorsEqual(
        { type: "mouse", button: { type: "other", number: 56 } },
        { type: "mouse", button: { type: "other", number: 56 } },
      ),
    ).toBe(true);
  });
});
