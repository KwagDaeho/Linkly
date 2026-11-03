import { comboEffectiveTrigger, activatorsEqual } from "@/domain/input/activator";
import {
  activatorToCaptureToken,
  activatorToCustomKeyToken,
} from "@/domain/keys/mouseKeyToken";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import { ballScrollOf } from "@/domain/profile";
import type { Activator, BallScrollSlot, Profile } from "@/types";

import {
  scopedButtonMappingsOf,
  scopedCustomMappingsOf,
  type TriggerScope,
} from "./triggerScope";

export class DuplicateActivatorError extends Error {
  readonly code = "duplicate_activator" as const;

  constructor() {
    super("duplicate_activator");
    this.name = "DuplicateActivatorError";
  }
}

const conflictTokensFor = (activator: Activator): Set<string> => {
  const normalized = normalizeActivator(activator);
  const tokens = new Set<string>();
  for (const token of [
    activatorToCaptureToken(normalized),
    activatorToCustomKeyToken(normalized),
  ]) {
    if (token !== null) {
      tokens.add(token);
    }
  }
  return tokens;
};

/** Same physical control even when stored as device vs mouse, etc. */
export const activatorsConflict = (a: Activator, b: Activator): boolean => {
  if (activatorsEqual(a, b)) {
    return true;
  }
  const left = conflictTokensFor(a);
  for (const token of conflictTokensFor(b)) {
    if (left.has(token)) {
      return true;
    }
  }
  return false;
};

/** Another row in this scope already owns the same single trigger. */
export const findButtonMappingActivatorConflict = (
  profile: Profile,
  scope: TriggerScope,
  activator: Activator,
  exceptEntryId?: string,
): string | null => {
  for (const entry of scopedButtonMappingsOf(profile, scope)) {
    if (entry.id === exceptEntryId) {
      continue;
    }
    if (
      entry.activator !== null &&
      activatorsConflict(entry.activator, activator)
    ) {
      return entry.id;
    }
  }
  return null;
};

export const findScopedActivatorConflict = (
  profile: Profile,
  scope: TriggerScope,
  activator: Activator,
  except?: {
    buttonMappingEntryId?: string;
    ballScrollSlot?: BallScrollSlot;
  },
): boolean => {
  if (
    findButtonMappingActivatorConflict(
      profile,
      scope,
      activator,
      except?.buttonMappingEntryId,
    ) !== null
  ) {
    return true;
  }
  for (const entry of scopedCustomMappingsOf(profile, scope)) {
    const trigger = comboEffectiveTrigger(entry.activator);
    if (trigger !== null && activatorsConflict(trigger, activator)) {
      return true;
    }
  }
  const ballScroll = ballScrollOf(profile.ballScroll);
  if (except?.ballScrollSlot !== "toggle") {
    const toggle = ballScroll.toggleActivator;
    if (
      toggle !== null &&
      toggle !== undefined &&
      activatorsConflict(toggle, activator)
    ) {
      return true;
    }
  }
  if (except?.ballScrollSlot !== "hold") {
    const hold = ballScroll.holdActivator;
    if (
      hold !== null &&
      hold !== undefined &&
      activatorsConflict(hold, activator)
    ) {
      return true;
    }
  }
  return false;
};

export const assertScopedActivatorAvailable = (
  profile: Profile,
  scope: TriggerScope,
  activator: Activator,
  except?: {
    buttonMappingEntryId?: string;
    ballScrollSlot?: BallScrollSlot;
  },
): void => {
  if (findScopedActivatorConflict(profile, scope, activator, except)) {
    throw new DuplicateActivatorError();
  }
};
