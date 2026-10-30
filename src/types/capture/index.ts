import type { Activator, BallScrollSlot, ComboActivator } from "../profile";

export type CaptureMode =
  | "off"
  | "custom_key"
  | "chord_hold"
  | "combo_capture"
  | "macro"
  | "ball_scroll"
  | "button_mapping_capture"
  | "combo_trigger";

export type CaptureSession = {
  keyCapture: boolean;
  comboTrigger: boolean;
  activatorCapture: boolean;
  uiModal: boolean;
  allowLeftActivator?: boolean;
  /** HUGE / OS left click acts like Esc while capture is listening. */
  leftClickEscape?: boolean;
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
  | { kind: "stop_listening" }
  | { kind: "reject"; rejected: string }
  | { kind: "assign"; slot: BallScrollSlot; activator: Activator }
  | {
      kind: "assign_combo";
      entryId: string;
      activator: Activator;
      chord: string[];
    }
  | {
      kind: "assign_button_mapping";
      entryId: string;
      activator: Activator;
    }
  | { kind: "append_custom_key"; token: string };
