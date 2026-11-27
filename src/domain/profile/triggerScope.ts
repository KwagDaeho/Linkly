import { buttonMappingsOf, customMappingsOf, longPressMs } from "@/domain/profile";
import type {
  ButtonMappingEntry,
  CustomMappingEntry,
  InputDeviceSettings,
  Profile,
} from "@/types";

export type TriggerScope =
  | { kind: "common" }
  | { kind: "device"; deviceKey: string };

/** Stable id of a scope ("common" or the device key). */
export const triggerScopeKey = (scope: TriggerScope): string =>
  scope.kind === "common" ? "common" : scope.deviceKey;

export const deviceSettingsOf = (
  profile: Profile,
  deviceKey: string,
): InputDeviceSettings => profile.inputDeviceSettings?.[deviceKey] ?? {};

export const individualLinkEnabled = (
  profile: Profile,
  deviceKey: string,
): boolean => deviceSettingsOf(profile, deviceKey).individualLinkEnabled === true;

export const deviceDisplayName = (
  profile: Profile,
  deviceKey: string,
  fallback: string,
): string => deviceSettingsOf(profile, deviceKey).displayName?.trim() || fallback;

/** Saved display name: trimmed, or unset when empty / same as the product name. */
export const normalizeDisplayName = (
  name: string,
  productName: string,
): string | undefined => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed !== productName ? trimmed : undefined;
};

const overrideBundle = (profile: Profile, deviceKey: string) =>
  profile.deviceTriggerOverrides?.[deviceKey];

export const scopedButtonMappingsOf = (
  profile: Profile,
  scope: TriggerScope,
): ButtonMappingEntry[] => {
  if (scope.kind === "common") {
    return buttonMappingsOf(profile);
  }
  // Device rows overlay the common ones (same input → device wins).
  return overrideBundle(profile, scope.deviceKey)?.buttonMappings ?? [];
};

/** Scope whose list holds button-mapping row `entryId` (rows have unique ids). */
export const scopeOfButtonMapping = (
  profile: Profile,
  entryId: string,
): TriggerScope => {
  for (const [deviceKey, bundle] of Object.entries(
    profile.deviceTriggerOverrides ?? {},
  )) {
    if (bundle.buttonMappings?.some((entry) => entry.id === entryId)) {
      return { kind: "device", deviceKey };
    }
  }
  return { kind: "common" };
};

/** Combo triggers are common only (they may mix inputs from several devices). */
export const scopedCustomMappingsOf = (
  profile: Profile,
  _scope: TriggerScope,
): CustomMappingEntry[] => customMappingsOf(profile);

export const scopedLongPressMs = (
  profile: Profile,
  scope: TriggerScope,
): number => {
  if (scope.kind === "device") {
    const override = overrideBundle(profile, scope.deviceKey)?.longPressMs;
    if (override !== undefined) {
      return override;
    }
  }
  return longPressMs(profile);
};

/** Rows of `scope` that have a trigger assigned. */
export const scopedSingleTriggerCount = (
  profile: Profile,
  scope: TriggerScope,
): number =>
  scopedButtonMappingsOf(profile, scope).filter((entry) => entry.activator !== null)
    .length;
