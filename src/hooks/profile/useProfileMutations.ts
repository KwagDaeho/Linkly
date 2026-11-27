import type { Dispatch, SetStateAction } from "react";
import {
  withBallScrollPatch,
  withMappingSlot,
  withPointerPatch,
} from "@/domain/profile";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import {
  newGestureEntry,
  withGestureAdded,
  withGestureMoved,
  withGesturePatch,
  withGestureRemoved,
  withGestureTemplate,
} from "@/domain/profile/patches/gestures";
import { withInputDeviceSettings } from "@/domain/profile/patches/scopedTriggers";
import { normalizeDisplayName } from "@/domain/profile/triggerScope";
import { applyCatalogSelection } from "@/services/catalogSelection";
import type {
  Action,
  ActionSlot,
  Activator,
  BallScrollSettings,
  BallScrollSlot,
  ButtonId,
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

  const gestures: ProfileMutations["gestures"] = {
    setActivator: (slot, activator) => {
      mutateProfile((loaded) =>
        withGesturePatch(
          loaded,
          slot === "toggle"
            ? { toggleActivator: activator }
            : { holdActivator: activator },
        ),
      );
    },
    add: (template) => {
      mutateProfile((loaded) => withGestureAdded(loaded, newGestureEntry(template)));
    },
    redraw: (id, template) => {
      mutateProfile((loaded) => withGestureTemplate(loaded, id, template));
    },
    move: (from, to) => {
      mutateProfile((loaded) => withGestureMoved(loaded, from, to));
    },
    remove: (id) => {
      mutateProfile((loaded) => withGestureRemoved(loaded, id));
    },
  };

  const settings: ProfileMutations["settings"] = {
    setEnabled: async (enabled) => {
      if (profile !== null) {
        await persist({ ...profile, enabled });
      }
    },
    setStartMinimized: async (startMinimized) => {
      if (profile !== null) {
        await persist({ ...profile, startMinimized });
      }
    },
  };

  const devices: ProfileMutations["devices"] = {
    setDisplayName: (deviceKey, name, productName) => {
      mutateProfile((loaded) =>
        withInputDeviceSettings(loaded, deviceKey, {
          displayName: normalizeDisplayName(name, productName),
        }),
      );
    },
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

  return {
    mappings: {
      updateSlot: updateMappingSlot,
    },
    pointer: {
      update: updatePointer,
    },
    ballScroll: {
      update: updateBallScroll,
      assignActivator: assignBallScrollActivator,
    },
    gestures,
    settings,
    devices,
    catalogSelection: {
      selectButton: selectCatalogValue,
    },
  };
};
