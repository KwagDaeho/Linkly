import { useMemo, type Dispatch, type SetStateAction } from "react";

import { withScopedMappingSlot } from "@/domain/profile/patches/scopedTriggers";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import {
  withScopedButtonMappingActivator,
  withScopedButtonMappingAdded,
  withScopedButtonMappingFlags,
  withScopedButtonMappingRemoved,
  withScopedCustomMappingActivator,
  withScopedCustomMappingAdded,
  withScopedCustomMappingFlags,
  withScopedCustomMappingRemoved,
  withScopedLongPressMs,
} from "@/domain/profile/patches/scopedTriggers";
import type { TriggerScope } from "@/domain/profile/triggerScope";
import { useProfileCtx } from "@/hooks/profile";
import { applyCatalogSelection } from "@/services/catalogSelection";
import type {
  Action,
  ActionSlot,
  Activator,
  ButtonBinding,
  ButtonMappingEntry,
  ComboActivator,
  CustomMappingEntry,
  EditorMode,
  MappingTarget,
} from "@/types";

export const useTriggerScopeMutations = (scope: TriggerScope) => {
  const { profile, mutateProfile, lifecycle } = useProfileCtx();

  const updateMappingSlot = (
    target: MappingTarget,
    slot: ActionSlot,
    action: Action,
  ) => {
    mutateProfile((loaded) =>
      withScopedMappingSlot(loaded, scope, target, slot, action),
    );
  };

  return useMemo(
    () => ({
      scope,
      persistLongPressMs: async (ms: number) => {
        if (profile === null) {
          return false;
        }
        return lifecycle.persist(withScopedLongPressMs(profile, scope, ms));
      },
      buttonMappings: {
        add: (entry: ButtonMappingEntry) => {
          mutateProfile((loaded) =>
            withScopedButtonMappingAdded(loaded, scope, entry),
          );
        },
        remove: (entryId: string) => {
          mutateProfile((loaded) =>
            withScopedButtonMappingRemoved(loaded, scope, entryId),
          );
        },
        updateFlags: (
          entryId: string,
          patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
        ) => {
          mutateProfile((loaded) =>
            withScopedButtonMappingFlags(loaded, scope, entryId, patch),
          );
        },
        updateActivator: async (entryId: string, activator: Activator) => {
          if (profile === null) {
            return;
          }
          const next = normalizeActivator(activator);
          const saved = await lifecycle.persist(
            withScopedButtonMappingActivator(profile, scope, entryId, next),
          );
          if (!saved) {
            throw new Error("save_profile failed");
          }
        },
      },
      customMappings: {
        add: (entry: CustomMappingEntry) => {
          mutateProfile((loaded) =>
            withScopedCustomMappingAdded(loaded, scope, entry),
          );
        },
        remove: (entryId: string) => {
          mutateProfile((loaded) =>
            withScopedCustomMappingRemoved(loaded, scope, entryId),
          );
        },
        updateFlags: (
          entryId: string,
          patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
        ) => {
          mutateProfile((loaded) =>
            withScopedCustomMappingFlags(loaded, scope, entryId, patch),
          );
        },
        updateActivator: (entryId: string, activator: ComboActivator) => {
          mutateProfile((loaded) =>
            withScopedCustomMappingActivator(loaded, scope, entryId, activator),
          );
        },
      },
      catalogSelection: {
        selectButtonMapping: (
          entryId: string,
          slot: ActionSlot,
          value: string,
          setEditor: Dispatch<SetStateAction<EditorMode | null>>,
        ) => {
          applyCatalogSelection(
            { kind: "button_mapping", id: entryId },
            slot,
            value,
            profile,
            setEditor,
            updateMappingSlot,
          );
        },
        selectCustom: (
          entryId: string,
          slot: ActionSlot,
          value: string,
          setEditor: Dispatch<SetStateAction<EditorMode | null>>,
        ) => {
          applyCatalogSelection(
            { kind: "custom", id: entryId },
            slot,
            value,
            profile,
            setEditor,
            updateMappingSlot,
          );
        },
      },
    }),
    [lifecycle, mutateProfile, profile, scope],
  );
};
