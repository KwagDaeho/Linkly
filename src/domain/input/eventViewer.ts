import type { InputEventLine } from "@/types";

export type EventViewerChannel = "keyboard" | "mouse";

export const eventViewerChannel = (line: InputEventLine): EventViewerChannel => {
  const kind = line.kind;
  if (kind === "keyDown" || kind === "keyUp" || kind === "flagsChanged") {
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
