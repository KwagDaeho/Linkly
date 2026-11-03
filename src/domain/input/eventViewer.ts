import type { InputEventLine, Lang } from "@/types";

import {
  formatViewerBracketPhase,
  formatViewerInputName,
  formatViewerMouseButtonName,
} from "./eventViewerFormat";

export type EventViewerChannel = "keyboard" | "mouse";

const isKeyboardKind = (kind: string): boolean =>
  kind === "keyDown" ||
  kind === "keyUp" ||
  kind === "flagsChanged" ||
  kind === "longPress" ||
  kind === "linkRemap";

const isMouseButtonKind = (kind: string): boolean =>
  kind === "mouseDown" || kind === "mouseUp";

const isMouseSpatialKind = (kind: string): boolean =>
  kind === "scrollWheel" || kind === "mouseMoved";

/** Route one event to zero or more viewer channels (keyboard vs mouse & scroll). */
export const eventViewerChannels = (
  line: InputEventLine,
): EventViewerChannel[] => {
  const channels = new Set<EventViewerChannel>();
  const kind = line.kind;

  if (isKeyboardKind(kind)) {
    channels.add("keyboard");
  }
  if (isMouseButtonKind(kind) && line.source === "os") {
    channels.add("keyboard");
    channels.add("mouse");
  }
  if (isMouseButtonKind(kind) || isMouseSpatialKind(kind)) {
    channels.add("mouse");
  }
  if (line.source === "hid") {
    channels.add("mouse");
  }
  if (line.summary.includes("key ") || line.summary.startsWith("mod ")) {
    channels.add("keyboard");
  }
  return [...channels];
};

export const eventViewerChannel = (
  line: InputEventLine,
): EventViewerChannel => eventViewerChannels(line)[0] ?? "mouse";

const parseKeyOrModLine = (
  summary: string,
): { name: string; phase: "down" | "up" } | null => {
  const mod = summary.match(/^mod (\S+) (down|up)$/);
  if (mod !== null) {
    return { name: mod[1]!, phase: mod[2] as "down" | "up" };
  }
  const key = summary.match(/^key (\S+) (down|up)$/);
  if (key !== null) {
    return { name: key[1]!, phase: key[2] as "down" | "up" };
  }
  return null;
};

const parseMouseButtonLine = (
  summary: string,
): { name: string; phase: "down" | "up" } | null => {
  const standard = summary.match(
    /^mouse (left|right|middle|back|forward) (down|up)$/,
  );
  if (standard !== null) {
    return {
      name: standard[1]!,
      phase: standard[2] as "down" | "up",
    };
  }
  const extra = summary.match(/^Button (\d+) (down|up)$/);
  if (extra !== null) {
    return {
      name: `button(${extra[1]})`,
      phase: extra[2] as "down" | "up",
    };
  }
  return null;
};

/** Single-line label for the readonly event row. */
export const formatEventRowText = (
  line: InputEventLine,
  lang: Lang = "ko",
): string => {
  const keyOrMod = parseKeyOrModLine(line.summary);
  if (keyOrMod !== null) {
    const label = formatViewerInputName(keyOrMod.name, lang);
    return formatViewerBracketPhase(label, keyOrMod.phase);
  }

  const mouseBtn = parseMouseButtonLine(line.summary);
  if (mouseBtn !== null) {
    const label =
      mouseBtn.name.startsWith("button(") || mouseBtn.name.includes("(")
        ? mouseBtn.name
        : formatViewerMouseButtonName(mouseBtn.name, lang);
    return formatViewerBracketPhase(label, mouseBtn.phase);
  }

  if (line.summary.startsWith("cursor ")) {
    return line.summary.replace(/^cursor /, lang === "ko" ? "커서 " : "cursor ");
  }
  if (line.summary.startsWith("scroll ")) {
    return line.summary;
  }

  return line.summary.replace(/^(OS|HID) · /, "");
};
