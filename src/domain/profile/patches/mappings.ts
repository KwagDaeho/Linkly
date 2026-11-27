import { moveItem } from "@/domain/list/dragReorder";
import {
  asBinding,
  bindingWithSlot,
  customMappingsOf,
  enforceTiltBindingFlags,
  catalogButtonFromComboTrigger,
  isTiltButton,
  resolveBindingFlags,
} from "@/domain/profile";
import type {
  Action,
  ActionSlot,
  ButtonBinding,
  ComboActivator,
  CustomMappingEntry,
  MappingTarget,
  Profile,
} from "@/types";
import { scopedButtonMappingsOf, scopeOfButtonMapping } from "../triggerScope";
import { withButtonMappingSlot } from "./buttonMappings";
import { withButtonSlot } from "./buttons";
import { withGestureSlot } from "./gestures";
import { withScopedButtonMappings } from "./scopedTriggers";

/** Combo triggers are common only (they may mix inputs from several devices). */
const withCustomMappings = (
  profile: Profile,
  entries: CustomMappingEntry[],
): Profile => ({ ...profile, customMappings: entries });

const mapCustomMappings = (
  profile: Profile,
  update: (entries: CustomMappingEntry[]) => CustomMappingEntry[],
): Profile => withCustomMappings(profile, update(customMappingsOf(profile)));

export const withMappingSlot = (
  profile: Profile,
  target: MappingTarget,
  slot: ActionSlot,
  action: Action,
): Profile => {
  if (target.kind === "button") {
    return withButtonSlot(profile, target.id, slot, action);
  }
  if (target.kind === "gesture") {
    return withGestureSlot(profile, target.id, slot, action);
  }
  if (target.kind === "button_mapping") {
    // Editors run in the app-level (common) scope; route by where the row lives.
    const scope = scopeOfButtonMapping(profile, target.id);
    if (scope.kind === "common") {
      return withButtonMappingSlot(profile, target.id, slot, action);
    }
    const nextEntries = scopedButtonMappingsOf(profile, scope).map((entry) =>
      entry.id !== target.id
        ? entry
        : { ...entry, ...bindingWithSlot(asBinding(entry), slot, action) },
    );
    return withScopedButtonMappings(profile, scope, nextEntries);
  }
  return mapCustomMappings(profile, (entries) =>
    entries.map((entry) => {
      if (entry.id !== target.id) {
        return entry;
      }
      const next = { ...entry, ...bindingWithSlot(asBinding(entry), slot, action) };
      const catalogButton = catalogButtonFromComboTrigger(entry.activator);
      if (catalogButton !== undefined && isTiltButton(catalogButton) && slot === "click") {
        return { ...next, ...enforceTiltBindingFlags(asBinding(next)) };
      }
      return next;
    }),
  );
};

export const withCustomMappingAdded = (
  profile: Profile,
  entry: CustomMappingEntry,
): Profile => mapCustomMappings(profile, (entries) => [...entries, entry]);

export const withCustomMappingMoved = (
  profile: Profile,
  from: number,
  to: number,
): Profile => mapCustomMappings(profile, (entries) => moveItem(entries, from, to));

export const withCustomMappingRemoved = (
  profile: Profile,
  entryId: string,
): Profile =>
  mapCustomMappings(profile, (entries) =>
    entries.filter((entry) => entry.id !== entryId),
  );

export const withCustomMappingActivator = (
  profile: Profile,
  entryId: string,
  activator: ComboActivator,
): Profile =>
  mapCustomMappings(profile, (entries) =>
    entries.map((entry) => {
      if (entry.id !== entryId) {
        return entry;
      }
      const next = { ...entry, activator };
      const catalogButton = catalogButtonFromComboTrigger(activator);
      if (catalogButton !== undefined && isTiltButton(catalogButton)) {
        return { ...next, ...enforceTiltBindingFlags(asBinding(entry)) };
      }
      return next;
    }),
  );

export const withCustomMappingFlags = (
  profile: Profile,
  entryId: string,
  patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
): Profile =>
  mapCustomMappings(profile, (entries) =>
    entries.map((entry) => {
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
    }),
  );
