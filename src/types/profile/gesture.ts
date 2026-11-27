import type { Activator, ButtonBinding } from "./model";

export type GesturePoint = { x: number; y: number };

/** A drawn shape (y grows downward) and the action it fires. */
export type GestureEntry = {
  id: string;
  template: GesturePoint[];
} & ButtonBinding;

export type GestureSlot = "toggle" | "hold";

export type GestureSettings = {
  holdActivator?: Activator | null;
  toggleActivator?: Activator | null;
  entries?: GestureEntry[];
};
