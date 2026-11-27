import { withCatalogButtonsFromRows } from "@/domain/profile/button/syncCatalogDeviceBinding";
import { moveItem } from "@/domain/list/dragReorder";
import type {
  ButtonBinding,
  ButtonMappingEntry,
  CustomMappingEntry,
  InputDeviceSettings,
  Profile,
} from "@/types";

import {
  asBinding,
  catalogButtonFromActivator,
  enforceTiltBindingFlags,
  isTiltButton,
  resolveBindingFlags,
} from "@/domain/profile";

import type { TriggerScope } from "../triggerScope";
import { scopedButtonMappingsOf } from "../triggerScope";
import { assertScopedActivatorAvailable } from "../triggerConflict";

const ensureDeviceOverride = (
  profile: Profile,
  deviceKey: string,
): Profile => {
  const existing = profile.deviceTriggerOverrides?.[deviceKey];
  if (existing !== undefined) {
    return profile;
  }
  return {
    ...profile,
    deviceTriggerOverrides: {
      ...profile.deviceTriggerOverrides,
      // Overlay: starts empty, common rows keep applying underneath.
      [deviceKey]: { buttonMappings: [] },
    },
  };
};

const writeDeviceOverride = (
  profile: Profile,
  deviceKey: string,
  patch: Partial<{
    buttonMappings: ButtonMappingEntry[];
    customMappings: CustomMappingEntry[];
    longPressMs: number;
  }>,
): Profile => {
  const base = ensureDeviceOverride(profile, deviceKey);
  const prev = base.deviceTriggerOverrides?.[deviceKey] ?? {};
  return {
    ...base,
    deviceTriggerOverrides: {
      ...base.deviceTriggerOverrides,
      [deviceKey]: { ...prev, ...patch },
    },
  };
};

export const withScopedLongPressMs = (
  profile: Profile,
  scope: TriggerScope,
  ms: number,
): Profile => {
  if (scope.kind === "common") {
    return { ...profile, longPressMs: ms };
  }
  return writeDeviceOverride(profile, scope.deviceKey, { longPressMs: ms });
};

/** Tilt buttons always auto-click and never long-press. */
const withTiltFlagsIfTilt = (entry: ButtonMappingEntry): ButtonMappingEntry => {
  const id = catalogButtonFromActivator(entry.activator);
  return id !== undefined && isTiltButton(id)
    ? { ...entry, ...enforceTiltBindingFlags(asBinding(entry)) }
    : entry;
};

export const withScopedButtonMappings = (
  profile: Profile,
  scope: TriggerScope,
  entries: ButtonMappingEntry[],
): Profile => {
  if (scope.kind === "common") {
    return withCatalogButtonsFromRows({ ...profile, buttonMappings: entries });
  }
  return writeDeviceOverride(profile, scope.deviceKey, {
    buttonMappings: entries,
  });
};

export const withScopedButtonMappingAdded = (
  profile: Profile,
  scope: TriggerScope,
  entry: ButtonMappingEntry,
): Profile => {
  if (entry.activator !== null) {
    assertScopedActivatorAvailable(profile, scope, entry.activator, {
      buttonMappingEntryId: entry.id,
    });
  }
  return withScopedButtonMappings(profile, scope, [
    ...scopedButtonMappingsOf(profile, scope),
    entry,
  ]);
};

export const withScopedButtonMappingMoved = (
  profile: Profile,
  scope: TriggerScope,
  from: number,
  to: number,
): Profile =>
  withScopedButtonMappings(
    profile,
    scope,
    moveItem(scopedButtonMappingsOf(profile, scope), from, to),
  );

export const withScopedButtonMappingRemoved = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
): Profile =>
  withScopedButtonMappings(
    profile,
    scope,
    scopedButtonMappingsOf(profile, scope).filter(
      (entry) => entry.id !== entryId,
    ),
  );

export const withScopedButtonMappingActivator = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
  activator: ButtonMappingEntry["activator"],
): Profile => {
  if (activator !== null) {
    assertScopedActivatorAvailable(profile, scope, activator, {
      buttonMappingEntryId: entryId,
    });
  }
  const nextEntries = scopedButtonMappingsOf(profile, scope).map((entry) =>
    entry.id === entryId ? withTiltFlagsIfTilt({ ...entry, activator }) : entry,
  );
  return withScopedButtonMappings(profile, scope, nextEntries);
};

export const withScopedButtonMappingFlags = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
  patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
): Profile => {
  const nextEntries = scopedButtonMappingsOf(profile, scope).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const currentBinding = asBinding(entry);
    const flags = resolveBindingFlags(currentBinding, patch);
    return withTiltFlagsIfTilt({ ...entry, ...currentBinding, ...flags });
  });
  return withScopedButtonMappings(profile, scope, nextEntries);
};

export const withInputDeviceSettings = (
  profile: Profile,
  deviceKey: string,
  patch: Partial<InputDeviceSettings>,
): Profile => ({
  ...profile,
  inputDeviceSettings: {
    ...profile.inputDeviceSettings,
    [deviceKey]: {
      ...profile.inputDeviceSettings?.[deviceKey],
      ...patch,
    },
  },
});
