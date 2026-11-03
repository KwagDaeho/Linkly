import { activatorsEqual } from "@/domain/input/activator";
import { ballScrollOf } from "@/domain/profile";
import type { Activator, BallScrollSlot, Profile } from "@/types";

import { scopedButtonMappingsOf, type TriggerScope } from "./triggerScope";

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
      activatorsEqual(entry.activator, activator)
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
  const ballScroll = ballScrollOf(profile.ballScroll);
  if (except?.ballScrollSlot !== "toggle") {
    const toggle = ballScroll.toggleActivator;
    if (
      toggle !== null &&
      toggle !== undefined &&
      activatorsEqual(toggle, activator)
    ) {
      return true;
    }
  }
  if (except?.ballScrollSlot !== "hold") {
    const hold = ballScroll.holdActivator;
    if (
      hold !== null &&
      hold !== undefined &&
      activatorsEqual(hold, activator)
    ) {
      return true;
    }
  }
  return false;
};
