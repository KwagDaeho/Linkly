import type { Activator } from "@/types";

import {
  mouseButtonEventNumber,
  normalizeMouseButton,
} from "@/domain/profile/mouseButton";

const MOUSE_TOKEN: Record<string, string> = {
  left: "MouseLeft",
  right: "MouseRight",
  middle: "MouseMiddle",
  back: "MouseBack",
  forward: "MouseForward",
};

/** Serialize a captured mouse activator into a custom-key / keystroke token. */
export const activatorToCustomKeyToken = (
  activator: Activator,
): string | null => {
  if (activator.type !== "mouse") {
    return null;
  }
  const normalized = normalizeMouseButton(activator.button);
  if (typeof normalized === "string") {
    return MOUSE_TOKEN[normalized] ?? null;
  }
  const cg = mouseButtonEventNumber(normalized);
  if (cg === null) {
    return null;
  }
  return `Button${cg + 1}`;
};

export const formatMouseKeyToken = (
  token: string,
  lang: "ko" | "en",
): string | null => {
  if (token === "MouseLeft") {
    return lang === "ko" ? "마우스 왼쪽" : "Mouse left";
  }
  if (token === "MouseRight") {
    return lang === "ko" ? "마우스 오른쪽" : "Mouse right";
  }
  if (token === "MouseMiddle") {
    return lang === "ko" ? "마우스 가운데" : "Mouse middle";
  }
  if (token === "MouseBack") {
    return lang === "ko" ? "마우스 뒤로" : "Mouse back";
  }
  if (token === "MouseForward") {
    return lang === "ko" ? "마우스 앞으로" : "Mouse forward";
  }
  if (token.startsWith("Button")) {
    const n = token.slice("Button".length);
    return lang === "ko" ? `버튼 ${n}` : `Button ${n}`;
  }
  return null;
};
