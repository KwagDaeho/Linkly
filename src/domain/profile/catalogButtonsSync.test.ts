import { describe, expect, it } from "vitest";

import type { ButtonBinding, ButtonId, ButtonMappingEntry, Profile } from "@/types";

import { migrateLegacyButtonMappings } from "./button/mapping";
import {
  withScopedButtonMappingActivator,
  withScopedButtonMappingFlags,
  withScopedButtonMappingRemoved,
} from "./patches/scopedTriggers";

const COMMON = { kind: "common" } as const;

const clickOf = (profile: Profile, id: ButtonId) =>
  (profile.buttons[id] as ButtonBinding | undefined)?.click;

const fn1Row: ButtonMappingEntry = {
  id: "r1",
  activator: { type: "device", button: "fn1" },
  click: { type: "double_click" },
  longPress: { type: "disabled" },
  longPressEnabled: false,
  autoClick: false,
};

const base = {
  buttons: { fn1: { ...fn1Row, id: undefined } },
  buttonMappings: [fn1Row],
} as unknown as Profile;

describe("catalog buttons follow the common rows", () => {
  it("resets a button whose row is deleted", () => {
    const next = withScopedButtonMappingRemoved(base, COMMON, "r1");
    expect(clickOf(next, "fn1")).toEqual({ type: "default" });
  });

  it("moves the binding when a row is re-targeted", () => {
    const next = withScopedButtonMappingActivator(base, COMMON, "r1", {
      type: "device",
      button: "fn2",
    });
    expect(clickOf(next, "fn1")).toEqual({ type: "default" });
    expect(clickOf(next, "fn2")).toEqual({ type: "double_click" });
  });

  it("keeps tilt rows on auto-click without long press", () => {
    const tilted = withScopedButtonMappingActivator(base, COMMON, "r1", {
      type: "device",
      button: "wheel_tilt_left",
    });
    const next = withScopedButtonMappingFlags(tilted, COMMON, "r1", {
      autoClick: false,
      longPressEnabled: true,
    });
    const row = next.buttonMappings?.[0];
    expect(row?.autoClick).toBe(true);
    expect(row?.longPressEnabled).toBe(false);
  });

  it("does not resurrect rows from default button copies", () => {
    const empty = withScopedButtonMappingRemoved(base, COMMON, "r1");
    expect(migrateLegacyButtonMappings(empty).buttonMappings).toEqual([]);
  });
});
