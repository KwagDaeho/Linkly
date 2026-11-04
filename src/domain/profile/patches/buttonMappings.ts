import {
  asBinding,
  enforceTiltBindingFlags,
  catalogButtonFromActivator,
  isTiltButton,
  resolveBindingFlags,
} from "@/domain/profile";
import { buttonMappingsOf } from "@/domain/profile/button";
import { mirrorMappingEntryToCatalogButton } from "@/domain/profile/button/syncCatalogDeviceBinding";
import type {
  Action,
  ActionSlot,
  Activator,
  ButtonBinding,
  ButtonMappingEntry,
  Profile,
} from "@/types";

export const withButtonMappingAdded = (
  profile: Profile,
  entry: ButtonMappingEntry,
): Profile => {
  return {
    ...profile,
    buttonMappings: [...buttonMappingsOf(profile), entry],
  };
};

export const withButtonMappingRemoved = (
  profile: Profile,
  entryId: string,
): Profile => {
  return {
    ...profile,
    buttonMappings: buttonMappingsOf(profile).filter(
      (entry) => entry.id !== entryId,
    ),
  };
};

export const withButtonMappingActivator = (
  profile: Profile,
  entryId: string,
  activator: Activator,
): Profile => {
  const nextEntries = buttonMappingsOf(profile).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const next = { ...entry, activator };
    const catalogButton = catalogButtonFromActivator(activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton)) {
      return { ...next, ...enforceTiltBindingFlags(asBinding(entry)) };
    }
    return next;
  });
  const nextProfile = { ...profile, buttonMappings: nextEntries };
  const updated = nextEntries.find((entry) => entry.id === entryId);
  return updated !== undefined
    ? mirrorMappingEntryToCatalogButton(nextProfile, updated)
    : nextProfile;
};

export const withButtonMappingFlags = (
  profile: Profile,
  entryId: string,
  patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
): Profile => {
  const nextEntries = buttonMappingsOf(profile).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const currentBinding = asBinding(entry);
    const catalogButton = catalogButtonFromActivator(entry.activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton)) {
      return { ...entry, ...currentBinding, ...enforceTiltBindingFlags(currentBinding) };
    }
    const flags = resolveBindingFlags(currentBinding, patch);
    return { ...entry, ...currentBinding, ...flags };
  });
  const nextProfile = { ...profile, buttonMappings: nextEntries };
  const updated = nextEntries.find((entry) => entry.id === entryId);
  return updated !== undefined
    ? mirrorMappingEntryToCatalogButton(nextProfile, updated)
    : nextProfile;
};

export const withButtonMappingSlot = (
  profile: Profile,
  entryId: string,
  slot: ActionSlot,
  action: Action,
): Profile => {
  const nextEntries = buttonMappingsOf(profile).map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }
    const currentBinding = asBinding(entry);
    const next =
      slot === "click"
        ? { ...entry, ...currentBinding, click: action }
        : { ...entry, ...currentBinding, longPress: action };
    const catalogButton = catalogButtonFromActivator(entry.activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton) && slot === "click") {
      return { ...next, ...enforceTiltBindingFlags(asBinding(next)) };
    }
    return next;
  });
  const nextProfile = { ...profile, buttonMappings: nextEntries };
  const updated = nextEntries.find((entry) => entry.id === entryId);
  return updated !== undefined
    ? mirrorMappingEntryToCatalogButton(nextProfile, updated)
    : nextProfile;
};
