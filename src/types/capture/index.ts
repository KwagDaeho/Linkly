import type { Activator, BallScrollSlot, ComboActivator } from "../profile";

export type CaptureMode =
  | "off"
  | "chord_hold"
  | "macro"
  | "ball_scroll"
  | "button_mapping_capture";

export type CaptureSession = {
  keyCapture: boolean;
  comboTrigger: boolean;
  activatorCapture: boolean;
  uiModal: boolean;
  allowLeftActivator?: boolean;
};

export type KeyCapturePayload = { keys: string[]; escape: boolean };

export type ActivatorCapturePayload = {
  escape: boolean;
  rejected: string | null;
  activator: Activator | null;
};

export type ComboTriggerCapturePayload = {
  escape: boolean;
  rejected: string | null;
  combo: ComboActivator | null;
};

export type ActivatorCaptureResult =
  | { kind: "close" }
  | { kind: "reject"; rejected: string }
  | { kind: "assign"; slot: BallScrollSlot; activator: Activator }
  | {
      kind: "assign_button_mapping";
      entryId: string;
      activator: Activator;
    };
