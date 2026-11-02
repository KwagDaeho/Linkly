import { splitChord } from "../chord";
import {
  mouseButtonEventNumber,
  normalizeActivator,
} from "../mouseButton";
import type {
  Activator,
  BallScrollSettings,
  BallScrollSlot,
  ComboActivator,
  ResolvedBallScrollSettings,
} from "@/types";

export const DEFAULT_BALL_SCROLL: ResolvedBallScrollSettings = {
  toggleEnabled: false,
  toggleActivator: null,
  holdEnabled: false,
  holdActivator: null,
  invertVertical: false,
  invertHorizontal: false,
  speed: 1,
};

export const ballScrollOf = (
  value: BallScrollSettings | undefined,
): ResolvedBallScrollSettings => {
  const merged: BallScrollSettings =
    value !== undefined
      ? { ...DEFAULT_BALL_SCROLL, ...value }
      : DEFAULT_BALL_SCROLL;
  const toggleActivator = merged.toggleActivator
    ? normalizeActivator(merged.toggleActivator)
    : null;
  const holdActivator = merged.holdActivator
    ? normalizeActivator(merged.holdActivator)
    : null;
  return {
    toggleEnabled: toggleActivator !== null ? true : merged.toggleEnabled,
    toggleActivator,
    holdEnabled: holdActivator !== null ? true : merged.holdEnabled,
    holdActivator,
    invertVertical: merged.invertVertical === true,
    invertHorizontal: merged.invertHorizontal === true,
    speed:
      merged.speed !== undefined ? merged.speed : DEFAULT_BALL_SCROLL.speed,
  };
};

export const activatorsEqual = (
  left: Activator | null,
  right: Activator | null,
): boolean => {
  if (left === null || right === null) {
    return false;
  }
  if (left.type !== right.type) {
    return false;
  }
  if (left.type === "key" && right.type === "key") {
    return left.name === right.name;
  }
  if (left.type === "mouse" && right.type === "mouse") {
    return (
      mouseButtonEventNumber(left.button) === mouseButtonEventNumber(right.button)
    );
  }
  if (left.type === "device" && right.type === "device") {
    return left.button === right.button;
  }
  return false;
};

export const comboFromDraft = (
  chord: string[],
  trigger: Activator,
): ComboActivator | null => {
  const { modifiers, keys } = splitChord(chord);
  if (modifiers.length === 0 && keys.length === 0) {
    return null;
  }
  return { modifiers, keys, trigger };
};

export const ballScrollActivatorForSlot = (
  ball: ResolvedBallScrollSettings,
  slot: BallScrollSlot,
): Activator | null => {
  return slot === "toggle" ? ball.toggleActivator : ball.holdActivator;
};
