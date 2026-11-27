import { asBinding, catalogButtonFromActivator } from "@/domain/profile";
import { CATALOG_BUTTON_IDS, buttonMappingsOf } from "@/domain/profile/button/mapping";
import { DEFAULT_BINDING } from "@/domain/profile/binding";
import type {
  ButtonBinding,
  ButtonId,
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

/**
 * Re-derive `profile.buttons` from the common list rows (the source of truth). The
 * backend falls back to `profile.buttons` for a catalog button without a row, so a
 * deleted or re-targeted row must reset its old button to default — otherwise the
 * removed mapping keeps firing.
 */
export const withCatalogButtonsFromRows = (profile: Profile): Profile => {
  const rows = buttonMappingsOf(profile);
  const buttons = { ...profile.buttons };
  for (const id of CATALOG_BUTTON_IDS) {
    const row = rows.find((entry) => catalogButtonFromActivator(entry.activator) === id);
    buttons[id] = row !== undefined ? asBinding(row) : { ...DEFAULT_BINDING };
  }
  return { ...profile, buttons };
};
