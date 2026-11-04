import { asBinding, catalogButtonFromActivator } from "@/domain/profile";
import { buttonMappingsOf } from "@/domain/profile/button";
import type {
  ButtonBinding,
  ButtonId,
  ButtonMappingEntry,
  Profile,
} from "@/types";

/** Keep `profile.buttons` and list rows aligned for fixed catalog device buttons (incl. Fn1–3). */
export const mirrorCatalogDeviceBinding = (
  profile: Profile,
  buttonId: ButtonId,
  binding: ButtonBinding,
): Profile => {
  const mappings = buttonMappingsOf(profile);
  const nextMappings = mappings.map((entry) =>
    catalogButtonFromActivator(entry.activator) === buttonId
      ? { ...entry, ...binding }
      : entry,
  );
  const hasListRow = mappings.some(
    (entry) => catalogButtonFromActivator(entry.activator) === buttonId,
  );
  return {
    ...profile,
    buttons: { ...profile.buttons, [buttonId]: binding },
    ...(hasListRow ? { buttonMappings: nextMappings } : {}),
  };
};

export const mirrorMappingEntryToCatalogButton = (
  profile: Profile,
  entry: ButtonMappingEntry,
): Profile => {
  const buttonId = catalogButtonFromActivator(entry.activator);
  if (buttonId === undefined) {
    return profile;
  }
  return mirrorCatalogDeviceBinding(profile, buttonId, asBinding(entry));
};
