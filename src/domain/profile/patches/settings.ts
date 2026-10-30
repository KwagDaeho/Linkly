import type { BallScrollSettings, Profile } from "@/types";
import { activatorsEqual, ballScrollOf } from "@/domain/profile";
export const withPointerPatch = <K extends keyof Profile["pointer"]>(
  profile: Profile,
  key: K,
  value: Profile["pointer"][K],
): Profile => {
  return {
    ...profile,
    pointer: { ...profile.pointer, [key]: value },
  };
};
export const withBallScrollPatch = (
  profile: Profile,
  patch: Partial<BallScrollSettings>,
): Profile => {
  let next = { ...ballScrollOf(profile.ballScroll), ...patch };
  if ("holdActivator" in patch) {
    next.holdEnabled = patch.holdActivator !== null && patch.holdActivator !== undefined;
  }
  if ("toggleActivator" in patch) {
    next.toggleEnabled =
      patch.toggleActivator !== null && patch.toggleActivator !== undefined;
  }
  if (
    next.toggleActivator &&
    next.holdActivator &&
    activatorsEqual(next.toggleActivator, next.holdActivator)
  ) {
    if (patch.toggleActivator) {
      next = { ...next, holdActivator: null };
    } else if (patch.holdActivator) {
      next = { ...next, toggleActivator: null };
    }
  }
  return { ...profile, ballScroll: next };
};
export const withLongPressMs = (
  profile: Profile,
  longPressMs: number,
): Profile => {
  return { ...profile, longPressMs };
};
