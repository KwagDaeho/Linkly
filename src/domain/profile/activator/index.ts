import { normalizeActivator } from "../mouseButton";
import type {
  Activator,
  BallScrollSettings,
  BallScrollSlot,
  ResolvedBallScrollSettings,
} from "@/types";

const DEFAULT_BALL_SCROLL: ResolvedBallScrollSettings = {
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



export const ballScrollActivatorForSlot = (
  ball: ResolvedBallScrollSettings,
  slot: BallScrollSlot,
): Activator | null => {
  return slot === "toggle" ? ball.toggleActivator : ball.holdActivator;
};
