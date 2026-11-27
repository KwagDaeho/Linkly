import {
  asBinding,
  bindingWithSlot,
  enforceTiltBindingFlags,
  catalogButtonFromActivator,
  isTiltButton,
} from "@/domain/profile";
import { buttonMappingsOf } from "@/domain/profile/button";
import { withCatalogButtonsFromRows } from "@/domain/profile/button/syncCatalogDeviceBinding";
import type { Action, ActionSlot, Profile } from "@/types";

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
    const next = { ...entry, ...bindingWithSlot(asBinding(entry), slot, action) };
    const catalogButton = catalogButtonFromActivator(entry.activator);
    if (catalogButton !== undefined && isTiltButton(catalogButton) && slot === "click") {
      return { ...next, ...enforceTiltBindingFlags(asBinding(next)) };
    }
    return next;
  });
  return withCatalogButtonsFromRows({ ...profile, buttonMappings: nextEntries });
};
