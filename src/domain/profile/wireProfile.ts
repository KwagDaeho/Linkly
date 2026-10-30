import { normalizeActivator } from "./mouseButton";
import type { Activator, MouseClickButton, Profile } from "@/types";

/** Rust `MouseClickButton::Other` wire shape (externally tagged enum). */
const mouseButtonToWire = (button: MouseClickButton): unknown => {
  if (typeof button === "string") {
    return button;
  }
  return { other: { number: button.number } };
};

const activatorToWire = (activator: Activator): Activator => {
  const normalized = normalizeActivator(activator);
  if (normalized.type !== "mouse") {
    return normalized;
  }
  return {
    type: "mouse",
    button: mouseButtonToWire(normalized.button) as MouseClickButton,
  };
};

/** Ensure mouse activators round-trip through Rust `save_profile` serde. */
export const wireProfileForBackend = (profile: Profile): Profile => {
  const ballScroll = profile.ballScroll;
  const nextBallScroll =
    ballScroll === undefined
      ? undefined
      : {
          ...ballScroll,
          toggleActivator:
            ballScroll.toggleActivator !== null &&
            ballScroll.toggleActivator !== undefined
              ? activatorToWire(ballScroll.toggleActivator)
              : ballScroll.toggleActivator,
          holdActivator:
            ballScroll.holdActivator !== null &&
            ballScroll.holdActivator !== undefined
              ? activatorToWire(ballScroll.holdActivator)
              : ballScroll.holdActivator,
        };

  const buttonMappings = profile.buttonMappings?.map((entry) => ({
    ...entry,
    activator:
      entry.activator !== null ? activatorToWire(entry.activator) : null,
  }));

  return {
    ...profile,
    ballScroll: nextBallScroll,
    buttonMappings,
  };
};
