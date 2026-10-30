import { deviceKeyFromIds } from "@/domain/device/deviceKey";
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

const overrideBundle = (profile: Profile, deviceKey: string) =>
  profile.deviceTriggerOverrides?.[deviceKey];

export const scopedButtonMappingsOf = (
  profile: Profile,
  scope: TriggerScope,
): ButtonMappingEntry[] => {
  if (scope.kind === "common") {
    return buttonMappingsOf(profile);
  }
  const override = overrideBundle(profile, scope.deviceKey)?.buttonMappings;
  return override ?? buttonMappingsOf(profile);
};

export const scopedCustomMappingsOf = (
  profile: Profile,
  scope: TriggerScope,
): CustomMappingEntry[] => {
  if (scope.kind === "common") {
    return customMappingsOf(profile);
  }
  const override = overrideBundle(profile, scope.deviceKey)?.customMappings;
  return override ?? customMappingsOf(profile);
};

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

export const deviceKeyForStatus = (vendorId: number, productId: number): string =>
  deviceKeyFromIds(vendorId, productId);

export const listIndividualLinkDeviceKeys = (profile: Profile): string[] => {
  const settings = profile.inputDeviceSettings;
  if (settings === undefined) {
    return [];
  }
  return Object.entries(settings)
    .filter(([, value]) => value.individualLinkEnabled === true)
    .map(([key]) => key)
    .sort((a, b) => a.localeCompare(b));
};
