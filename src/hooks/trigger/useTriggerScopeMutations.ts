import { useMemo, type Dispatch, type SetStateAction } from "react";

import { normalizeActivator } from "@/domain/profile/mouseButton";
import {
  withCustomMappingActivator,
  withCustomMappingAdded,
  withCustomMappingFlags,
  withCustomMappingMoved,
  withCustomMappingRemoved,
  withMappingSlot,
} from "@/domain/profile/patches";
import {
  withScopedButtonMappingActivator,
  withScopedButtonMappingAdded,
  withScopedButtonMappingFlags,
  withScopedButtonMappingMoved,
  withScopedButtonMappingRemoved,
  withScopedLongPressMs,
} from "@/domain/profile/patches/scopedTriggers";
import type { TriggerScope } from "@/domain/profile/triggerScope";
import { newButtonMappingEntry } from "@/domain/profile";
import { findScopedActivatorConflict } from "@/domain/profile/triggerConflict";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { publishToast } from "@/services/toastBus";
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
  const { i18n } = usePrefs();
  const { profile, mutateProfile, lifecycle } = useProfileCtx();

  const updateMappingSlot = (
    target: MappingTarget,
    slot: ActionSlot,
    action: Action,
  ) => {
    mutateProfile((loaded) =>
      withMappingSlot(loaded, target, slot, action),
    );
  };

  return useMemo(() => {
    const addButtonMapping = (entry: ButtonMappingEntry) => {
      mutateProfile((loaded) =>
        withScopedButtonMappingAdded(loaded, scope, entry),
      );
    };
    const updateButtonMappingActivator = async (
      entryId: string,
      activator: Activator,
    ) => {
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
    };
    return {
      scope,
      persistLongPressMs: async (ms: number) => {
        if (profile === null) {
          return false;
        }
        return lifecycle.persist(withScopedLongPressMs(profile, scope, ms));
      },
      buttonMappings: {
        add: addButtonMapping,
        remove: (entryId: string) => {
          mutateProfile((loaded) =>
            withScopedButtonMappingRemoved(loaded, scope, entryId),
          );
        },
        move: (from: number, to: number) => {
          mutateProfile((loaded) =>
            withScopedButtonMappingMoved(loaded, scope, from, to),
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
        updateActivator: updateButtonMappingActivator,
        /** Device scope: key captured on the keyboard → new row (null) or row `entryId`. */
        assignKeyTrigger: (entryId: string | null, keyName: string) => {
          if (profile === null) {
            return;
          }
          const activator: Activator = { type: "key", name: keyName };
          if (
            findScopedActivatorConflict(profile, scope, activator, {
              buttonMappingEntryId: entryId ?? undefined,
            })
          ) {
            publishToast(i18n.buttonMappingAlreadyRegistered);
            return;
          }
          if (entryId === null) {
            addButtonMapping({ ...newButtonMappingEntry(), activator });
          } else {
            void updateButtonMappingActivator(entryId, activator);
          }
        },
      },
      customMappings: {
        add: (entry: CustomMappingEntry) => {
          mutateProfile((loaded) =>
            withCustomMappingAdded(loaded, entry),
          );
        },
        remove: (entryId: string) => {
          mutateProfile((loaded) =>
            withCustomMappingRemoved(loaded, entryId),
          );
        },
        move: (from: number, to: number) => {
          mutateProfile((loaded) =>
            withCustomMappingMoved(loaded, from, to),
          );
        },
        updateFlags: (
          entryId: string,
          patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
        ) => {
          mutateProfile((loaded) =>
            withCustomMappingFlags(loaded, entryId, patch),
          );
        },
        updateActivator: (entryId: string, activator: ComboActivator) => {
          mutateProfile((loaded) =>
            withCustomMappingActivator(loaded, entryId, activator),
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
    };
  }, [i18n, lifecycle, mutateProfile, profile, scope]);
};
