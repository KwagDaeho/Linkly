import type { Dispatch, SetStateAction } from "react";
import type { Action } from "../action";
import type { ButtonMeta } from "../device";
import type { ActionSlot, EditorMode, MappingTarget } from "../ui";
import type {
  Activator,
  BallScrollSettings,
  BallScrollSlot,
  ButtonId,
  Profile,
} from "./model";
import type { GesturePoint, GestureSlot } from "./gesture";

export type ProfileLifecycle = {
  persist: (nextProfile: Profile) => Promise<boolean>;
  setBootError: (message: string) => void;
  refresh: () => Promise<void>;
};

export type ProfileMutateFn = (
  applyPatch: (loadedProfile: Profile) => Profile,
) => void;

export type ProfileLoader = {
  profile: Profile | null;
  catalog: ButtonMeta[];
  bootError: string;
  lifecycle: ProfileLifecycle;
  mutateProfile: ProfileMutateFn;
};

export type ProfileMappingMutations = {
  updateSlot: (target: MappingTarget, slot: ActionSlot, action: Action) => void;
};

export type ProfilePointerMutations = {
  update: <K extends keyof Profile["pointer"]>(
    key: K,
    value: Profile["pointer"][K],
  ) => void;
};

export type ProfileBallScrollMutations = {
  update: (patch: Partial<BallScrollSettings>) => void;
  assignActivator: (
    slot: BallScrollSlot,
    activator: Activator,
  ) => Promise<void>;
};

export type ProfileGestureMutations = {
  setActivator: (slot: GestureSlot, activator: Activator | null) => void;
  add: (template: GesturePoint[]) => void;
  redraw: (id: string, template: GesturePoint[]) => void;
  move: (from: number, to: number) => void;
  remove: (id: string) => void;
};

export type ProfileSettingsMutations = {
  setEnabled: (enabled: boolean) => Promise<void>;
  setStartMinimized: (startMinimized: boolean) => Promise<void>;
};

export type ProfileDeviceMutations = {
  /** `name` is normalized (empty / product name → default label). */
  setDisplayName: (deviceKey: string, name: string, productName: string) => void;
};

export type ProfileCatalogMutations = {
  selectButton: (
    buttonId: ButtonId,
    slot: ActionSlot,
    value: string,
    setEditor: Dispatch<SetStateAction<EditorMode | null>>,
  ) => void;
};

export type ProfileMutations = {
  mappings: ProfileMappingMutations;
  pointer: ProfilePointerMutations;
  ballScroll: ProfileBallScrollMutations;
  gestures: ProfileGestureMutations;
  settings: ProfileSettingsMutations;
  devices: ProfileDeviceMutations;
  catalogSelection: ProfileCatalogMutations;
};

export type ProfileState = {
  profile: Profile | null;
  catalog: ButtonMeta[];
  bootError: string;
  lifecycle: ProfileLifecycle;
  mappings: ProfileMappingMutations;
  pointer: ProfilePointerMutations;
  ballScroll: ProfileBallScrollMutations;
  gestures: ProfileGestureMutations;
  settings: ProfileSettingsMutations;
  devices: ProfileDeviceMutations;
  catalogSelection: ProfileCatalogMutations;
  mutateProfile: ProfileMutateFn;
};
