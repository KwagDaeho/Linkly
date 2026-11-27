import { describe, expect, it } from "vitest";

import type { ButtonMappingEntry, Profile } from "@/types";

import { deviceTriggerProxyCount } from "./deviceTriggers";
import { scopeOfButtonMapping, scopedButtonMappingsOf } from "./triggerScope";

const row = (id: string, name: string, click: ButtonMappingEntry["click"]): ButtonMappingEntry => ({
  id,
  activator: { type: "key", name },
  click,
  longPress: { type: "disabled" },
});

const profile = {
  buttonMappings: [row("c1", "P", { type: "double_click" })],
  deviceTriggerOverrides: {
    "1-2": {
      buttonMappings: [
        row("d1", "N", { type: "key_stroke", keys: ["LeftMeta"] }),
        row("d2", "P", { type: "mouse_click", button: "left" }),
      ],
    },
  },
} as unknown as Profile;

describe("device triggers", () => {
  it("lists only the device's own rows in its scope", () => {
    expect(
      scopedButtonMappingsOf(profile, { kind: "device", deviceKey: "1-2" }).map((r) => r.id),
    ).toEqual(["d1", "d2"]);
    expect(
      scopedButtonMappingsOf(profile, { kind: "device", deviceKey: "9-9" }),
    ).toEqual([]);
  });

  it("finds the scope a row lives in", () => {
    expect(scopeOfButtonMapping(profile, "d2")).toEqual({ kind: "device", deviceKey: "1-2" });
    expect(scopeOfButtonMapping(profile, "c1")).toEqual({ kind: "common" });
  });

  it("counts only rows that need a relay key", () => {
    expect(deviceTriggerProxyCount(profile)).toBe(1);
  });
});
