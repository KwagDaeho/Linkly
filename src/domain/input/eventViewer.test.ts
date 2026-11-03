import { describe, expect, it } from "vitest";

import {
  eventViewerChannels,
  formatEventRowText,
} from "@/domain/input/eventViewer";
import type { InputEventLine } from "@/types";

const line = (partial: Partial<InputEventLine> & Pick<InputEventLine, "kind" | "summary">): InputEventLine => ({
  tsMs: 0,
  source: "os",
  detail: partial.summary,
  ...partial,
});

describe("eventViewerChannels", () => {
  it("routes OS mouse buttons to keyboard and mouse viewers", () => {
    const mouse = line({ kind: "mouseDown", summary: "mouse left down" });
    expect(eventViewerChannels(mouse).sort()).toEqual(["keyboard", "mouse"]);
  });

  it("routes keys and side modifiers to keyboard only", () => {
    expect(
      eventViewerChannels(line({ kind: "keyDown", summary: "mod LeftMeta down" })),
    ).toEqual(["keyboard"]);
    expect(
      eventViewerChannels(line({ kind: "flagsChanged", summary: "mod RightOption up" })),
    ).toEqual(["keyboard"]);
  });

  it("routes scroll and cursor to mouse viewer", () => {
    expect(
      eventViewerChannels(line({ kind: "scrollWheel", summary: "scroll Δ(0,-1)" })),
    ).toEqual(["mouse"]);
    expect(
      eventViewerChannels(line({ kind: "mouseMoved", summary: "cursor (10,20)" })),
    ).toEqual(["mouse"]);
  });

  it("routes HID reports to mouse viewer", () => {
    expect(
      eventViewerChannels(
        line({ kind: "hidReport", summary: "[left]", source: "hid" }),
      ),
    ).toEqual(["mouse"]);
  });
});

describe("formatEventRowText", () => {
  it("uses bracket Up/Down for keys and side modifiers", () => {
    expect(
      formatEventRowText(
        line({ kind: "keyDown", summary: "key T down" }),
        "en",
      ),
    ).toBe("[ T ] Down");
    expect(
      formatEventRowText(
        line({ kind: "keyUp", summary: "key Q up" }),
        "en",
      ),
    ).toBe("[ Q ] Up");
    expect(
      formatEventRowText(
        line({ kind: "flagsChanged", summary: "mod RightMeta down" }),
        "en",
      ),
    ).toBe("[ command(R) ] Down");
    expect(
      formatEventRowText(
        line({ kind: "flagsChanged", summary: "mod LeftShift up" }),
        "en",
      ),
    ).toBe("[ shift(L) ] Up");
  });

  it("uses the same bracket Up/Down for mouse buttons", () => {
    expect(
      formatEventRowText(
        line({ kind: "mouseDown", summary: "mouse left down" }),
        "en",
      ),
    ).toBe("[ mouse(left) ] Down");
    expect(
      formatEventRowText(
        line({ kind: "mouseUp", summary: "mouse right up" }),
        "en",
      ),
    ).toBe("[ mouse(right) ] Up");
  });
});
