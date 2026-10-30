import type { MacroStep } from "../action";
import type { InstalledAppWithIcon } from "../device";
import type {
  ButtonId,
  ButtonMappingEntry,
  CustomMappingEntry,
} from "../profile";
export type PermissionStatus = {
  accessibility: boolean;
  inputMonitoring: boolean;
  postEvent: boolean;
  ready: boolean;
};

export type ActionSlot = "click" | "long_press";

/** Chord-hold capture UX: start button → recognizing → 1s confirmed. */
export type HoldCapturePhase = "idle" | "recognizing" | "confirmed";

export type MappingTarget =
  | { kind: "button"; id: ButtonId }
  | { kind: "button_mapping"; id: string }
  | { kind: "custom"; id: string };

export type EditorMode =
  | {
      kind: "custom_key";
      target: MappingTarget;
      slot: ActionSlot;
      listening: boolean;
      holdPhase: HoldCapturePhase;
      pending: string[];
      confirmed: string[];
    }
  | {
      kind: "macro";
      target: MappingTarget;
      slot: ActionSlot;
      steps: MacroStep[];
      keyPrompt: { mode: "add" } | { mode: "edit"; index: number } | null;
    }
  | {
      kind: "open_app";
      target: MappingTarget;
      slot: ActionSlot;
      query: string;
      selected: { name: string; bundleId: string } | null;
      apps: InstalledAppWithIcon[];
      loading: boolean;
      error: string | null;
    }
  | {
      kind: "ball_scroll_activator";
      slot: "toggle" | "hold";
      rejected: string | null;
    }
  | {
      kind: "button_mapping_activator";
      entryId: string;
      /** Set while adding a row — profile gets the entry on capture commit. */
      draftEntry?: ButtonMappingEntry;
      rejected: string | null;
      listening: boolean;
    }
  | {
      kind: "custom_combo_activator";
      entryId: string;
      /** Set while adding a row — profile gets the entry on save. */
      draftEntry?: CustomMappingEntry;
      rejected: string | null;
      listening: boolean;
      holdPhase: HoldCapturePhase;
      pending: string[];
      confirmed: string[];
    };

export type TabId = "trigger" | "mouse" | "system" | "devices";
export type Theme = "light" | "dark";
