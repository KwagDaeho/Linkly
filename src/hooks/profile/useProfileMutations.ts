import type { Dispatch, SetStateAction } from "react";
import {
  isTiltButton,
  withBallScrollPatch,
  withButtonFlags,
  withButtonSlot,
  withButtonMappingActivator,
  withButtonMappingAdded,
  withButtonMappingFlags,
  withButtonMappingRemoved,
  withCustomMappingActivator,
  withCustomMappingAdded,
  withCustomMappingFlags,
  withCustomMappingRemoved,
  withMappingSlot,
  withPointerPatch,
} from "@/domain/profile";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import { applyCatalogSelection } from "@/services/catalogSelection";
import type {
  Action,
  ActionSlot,
  Activator,
  BallScrollSettings,
  BallScrollSlot,
  ButtonBinding,
  ButtonId,
  ButtonMappingEntry,
  ComboActivator,
  CustomMappingEntry,
  EditorMode,
  MappingTarget,
  Profile,
  ProfileLifecycle,
  ProfileMutateFn,
  ProfileMutations,
} from "@/types";

export const useProfileMutations = (
  profile: Profile | null,
  mutateProfile: ProfileMutateFn,
  persist: ProfileLifecycle["persist"],
): ProfileMutations => {
  const updateMappingSlot = (
    target: MappingTarget,
    slot: ActionSlot,
    action: Action,
  ) => {
    mutateProfile((loadedProfile) =>
      withMappingSlot(loadedProfile, target, slot, action),
    );
  };

  const updateButtonSlot = (
    buttonId: ButtonId,
    slot: ActionSlot,
    action: Action,
  ) => {
    mutateProfile((loadedProfile) =>
      withButtonSlot(loadedProfile, buttonId, slot, action),
    );
  };

  const updateButtonFlags = (
    buttonId: ButtonId,
    patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
  ) => {
    if (isTiltButton(buttonId)) {
      return;
    }
    mutateProfile((loadedProfile) =>
      withButtonFlags(loadedProfile, buttonId, patch),
    );
  };

  const updatePointer = <K extends keyof Profile["pointer"]>(
    key: K,
    value: Profile["pointer"][K],
  ) => {
    mutateProfile((loadedProfile) =>
      withPointerPatch(loadedProfile, key, value),
    );
  };

  const updateBallScroll = (patch: Partial<BallScrollSettings>) => {
    mutateProfile((loadedProfile) => withBallScrollPatch(loadedProfile, patch));
  };

  const assignBallScrollActivator = async (
    slot: BallScrollSlot,
    activator: Activator,
  ) => {
    if (profile === null) {
      return;
    }
    const next = normalizeActivator(activator);
    const patch: Partial<BallScrollSettings> =
      slot === "toggle"
        ? { toggleActivator: next, toggleEnabled: true }
        : { holdActivator: next, holdEnabled: true };
    const saved = await persist(withBallScrollPatch(profile, patch));
    if (!saved) {
      throw new Error("save_profile failed");
    }
  };

  const updateCustomMappingFlags = (
    entryId: string,
    patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
  ) => {
    mutateProfile((loadedProfile) =>
      withCustomMappingFlags(loadedProfile, entryId, patch),
    );
  };

  const addButtonMapping = (entry: ButtonMappingEntry) => {
    mutateProfile((loadedProfile) =>
      withButtonMappingAdded(loadedProfile, entry),
    );
  };

  const removeButtonMapping = (entryId: string) => {
    mutateProfile((loadedProfile) =>
      withButtonMappingRemoved(loadedProfile, entryId),
    );
  };

  const updateButtonMappingFlags = (
    entryId: string,
    patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
  ) => {
    mutateProfile((loadedProfile) =>
      withButtonMappingFlags(loadedProfile, entryId, patch),
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
    const saved = await persist(
      withButtonMappingActivator(profile, entryId, next),
    );
    if (!saved) {
      throw new Error("save_profile failed");
    }
  };

  const addCustomMapping = (entry: CustomMappingEntry) => {
    mutateProfile((loadedProfile) =>
      withCustomMappingAdded(loadedProfile, entry),
    );
  };

  const removeCustomMapping = (entryId: string) => {
    mutateProfile((loadedProfile) =>
      withCustomMappingRemoved(loadedProfile, entryId),
    );
  };

  const updateCustomMappingActivator = (
    entryId: string,
    activator: ComboActivator,
  ) => {
    mutateProfile((loadedProfile) =>
      withCustomMappingActivator(loadedProfile, entryId, activator),
    );
  };

  const selectCatalogValue = (
    buttonId: ButtonId,
    slot: ActionSlot,
    value: string,
    setEditor: Dispatch<SetStateAction<EditorMode | null>>,
  ) => {
    applyCatalogSelection(
      { kind: "button", id: buttonId },
      slot,
      value,
      profile,
      setEditor,
      updateMappingSlot,
    );
  };

  const selectCustomCatalogValue = (
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
  };

  const selectButtonMappingCatalogValue = (
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
  };

  return {
    mappings: {
      updateSlot: updateMappingSlot,
      updateButtonSlot,
      updateButtonFlags,
    },
    buttonMappings: {
      add: addButtonMapping,
      remove: removeButtonMapping,
      updateFlags: updateButtonMappingFlags,
      updateActivator: updateButtonMappingActivator,
    },
    customMappings: {
      add: addCustomMapping,
      remove: removeCustomMapping,
      updateFlags: updateCustomMappingFlags,
      updateActivator: updateCustomMappingActivator,
    },
    pointer: {
      update: updatePointer,
    },
    ballScroll: {
      update: updateBallScroll,
      assignActivator: assignBallScrollActivator,
    },
    catalogSelection: {
      selectButton: selectCatalogValue,
      selectCustom: selectCustomCatalogValue,
      selectButtonMapping: selectButtonMappingCatalogValue,
    },
  };
};
