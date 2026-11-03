import { describe, expect, it } from "vitest";

import {
  activatorsConflict,
  findButtonMappingActivatorConflict,
} from "@/domain/profile/triggerConflict";
import type { Profile } from "@/types";

const baseProfile = (): Profile =>
  ({
    enabled: true,
    buttonMappings: [
      {
        id: "a",
        activator: { type: "device", button: "fn1" },
        click: { type: "default" },
        longPress: { type: "disabled" },
        longPressEnabled: false,
        autoClick: false,
      },
      {
        id: "b",
        activator: null,
        click: { type: "default" },
        longPress: { type: "disabled" },
        longPressEnabled: false,
        autoClick: false,
      },
    ],
  }) as Profile;

describe("findButtonMappingActivatorConflict", () => {
  it("detects the same trigger on another row", () => {
    const profile = baseProfile();
    expect(
      findButtonMappingActivatorConflict(
        profile,
        { kind: "common" },
        { type: "device", button: "fn1" },
        "b",
      ),
    ).toBe("a");
  });

  it("ignores the row being edited", () => {
    const profile = baseProfile();
    expect(
      findButtonMappingActivatorConflict(
        profile,
        { kind: "common" },
        { type: "device", button: "fn1" },
        "a",
      ),
    ).toBeNull();
  });

  it("treats catalog left and mouse left as the same trigger", () => {
    const profile = baseProfile();
    profile.buttonMappings![0].activator = { type: "device", button: "left" };
    expect(
      findButtonMappingActivatorConflict(
        profile,
        { kind: "common" },
        { type: "mouse", button: "left" },
        "b",
      ),
    ).toBe("a");
    expect(
      activatorsConflict(
        { type: "device", button: "left" },
        { type: "mouse", button: "left" },
      ),
    ).toBe(true);
  });
});
