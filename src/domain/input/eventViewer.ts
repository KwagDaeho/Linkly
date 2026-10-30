import type { InputEventLine } from "@/types";

export type EventViewerChannel = "keyboard" | "mouse";

const STANDARD_MOUSE_PREFIX =
  /^mouse (left|right|middle|back|forward) (down|up)$/;

/** Extra OS buttons (e.g. Button 30) — combo triggers; show in keyboard viewer. */
export const isCustomOsMouseLine = (line: InputEventLine): boolean => {
  const kind = line.kind;
  if (kind !== "mouseDown" && kind !== "mouseUp") {
    return false;
  }
  if (line.source !== "os") {
    return false;
  }
  return !STANDARD_MOUSE_PREFIX.test(line.summary);
};

export const eventViewerChannel = (line: InputEventLine): EventViewerChannel => {
  const kind = line.kind;
  if (
    kind === "keyDown" ||
    kind === "keyUp" ||
    kind === "flagsChanged" ||
    kind === "longPress" ||
    kind === "linkRemap"
  ) {
    return "keyboard";
  }
  if (isCustomOsMouseLine(line)) {
    return "keyboard";
  }
  if (line.source === "hid") {
    return "mouse";
  }
  if (kind === "mouseDown" || kind === "mouseUp" || kind === "scrollWheel") {
    return "mouse";
  }
  if (line.summary.includes("key ")) {
    return "keyboard";
  }
  return "mouse";
};

/** Single-line label for the readonly event row. */
export const formatEventRowText = (line: InputEventLine): string =>
  line.summary.replace(/^(OS|HID) · /, "");
