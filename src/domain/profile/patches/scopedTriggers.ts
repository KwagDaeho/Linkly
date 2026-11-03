import type {
  Action,
  ActionSlot,
  ButtonBinding,
  ButtonMappingEntry,
  ComboActivator,
  CustomMappingEntry,
  MappingTarget,
  InputDeviceSettings,
  Profile,
} from "@/types";

import {
  asBinding,
  buttonMappingsOf,
  customMappingsOf,
  enforceTiltBindingFlags,
  catalogButtonFromComboTrigger,
  isTiltButton,
  resolveBindingFlags,
} from "@/domain/profile";
import { withButtonSlot } from "@/domain/profile/patches/buttons";
import { withButtonMappingSlot } from "@/domain/profile/patches/buttonMappings";

import type { TriggerScope } from "../triggerScope";
import {
  scopedButtonMappingsOf,
  scopedCustomMappingsOf,
} from "../triggerScope";
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
      [deviceKey]: {
        buttonMappings: [...buttonMappingsOf(profile)],
        customMappings: [...customMappingsOf(profile)],
        longPressMs: profile.longPressMs,
      },
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

export const withScopedButtonMappings = (
  profile: Profile,
  scope: TriggerScope,
  entries: ButtonMappingEntry[],
): Profile => {
  if (scope.kind === "common") {
    return { ...profile, buttonMappings: entries };
  }
  return writeDeviceOverride(profile, scope.deviceKey, {
    buttonMappings: entries,
  });
};

export const withScopedCustomMappings = (
  profile: Profile,
  scope: TriggerScope,
  entries: CustomMappingEntry[],
): Profile => {
  if (scope.kind === "common") {
    return { ...profile, customMappings: entries };
  }
  return writeDeviceOverride(profile, scope.deviceKey, {
    customMappings: entries,
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
    entry.id === entryId ? { ...entry, activator } : entry,
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
    return { ...entry, ...currentBinding, ...flags };
  });
  return withScopedButtonMappings(profile, scope, nextEntries);
};

export const withScopedCustomMappingAdded = (
  profile: Profile,
  scope: TriggerScope,
  entry: CustomMappingEntry,
): Profile =>
  withScopedCustomMappings(profile, scope, [
    ...scopedCustomMappingsOf(profile, scope),
    entry,
  ]);

export const withScopedCustomMappingRemoved = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
): Profile =>
  withScopedCustomMappings(
    profile,
    scope,
    scopedCustomMappingsOf(profile, scope).filter(
      (entry) => entry.id !== entryId,
    ),
  );

export const withScopedCustomMappingActivator = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
  activator: ComboActivator,
): Profile => {
  const nextEntries = scopedCustomMappingsOf(profile, scope).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const next = { ...entry, activator };
    const catalogButton = catalogButtonFromComboTrigger(activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton)) {
      return { ...next, ...enforceTiltBindingFlags(asBinding(entry)) };
    }
    return next;
  });
  return withScopedCustomMappings(profile, scope, nextEntries);
};

export const withScopedCustomMappingFlags = (
  profile: Profile,
  scope: TriggerScope,
  entryId: string,
  patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
): Profile => {
  const nextEntries = scopedCustomMappingsOf(profile, scope).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const currentBinding = asBinding(entry);
    const catalogButton = catalogButtonFromComboTrigger(entry.activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton)) {
      return { ...entry, ...currentBinding, ...enforceTiltBindingFlags(currentBinding) };
    }
    const flags = resolveBindingFlags(currentBinding, patch);
    return { ...entry, ...currentBinding, ...flags };
  });
  return withScopedCustomMappings(profile, scope, nextEntries);
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

export const withScopedMappingSlot = (
  profile: Profile,
  scope: TriggerScope,
  target: MappingTarget,
  slot: ActionSlot,
  action: Action,
): Profile => {
  if (target.kind === "button") {
    return withButtonSlot(profile, target.id, slot, action);
  }
  if (target.kind === "button_mapping") {
    if (scope.kind === "common") {
      return withButtonMappingSlot(profile, target.id, slot, action);
    }
    const nextEntries = scopedButtonMappingsOf(profile, scope).map((entry) => {
      if (entry.id !== target.id) {
        return entry;
      }
      const currentBinding = asBinding(entry);
      const next =
        slot === "click"
          ? { ...entry, ...currentBinding, click: action }
          : { ...entry, ...currentBinding, longPress: action };
      return next;
    });
    return withScopedButtonMappings(profile, scope, nextEntries);
  }
  const nextEntries = scopedCustomMappingsOf(profile, scope).map((entry) => {
    if (entry.id !== target.id) {
      return entry;
    }
    const currentBinding = asBinding(entry);
    const next =
      slot === "click"
        ? { ...entry, ...currentBinding, click: action }
        : { ...entry, ...currentBinding, longPress: action };
    const catalogButton = catalogButtonFromComboTrigger(entry.activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton) && slot === "click") {
      return { ...next, ...enforceTiltBindingFlags(asBinding(next)) };
    }
    return next;
  });
  return withScopedCustomMappings(profile, scope, nextEntries);
};
