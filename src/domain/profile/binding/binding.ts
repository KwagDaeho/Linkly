import type { Action, ActionSlot, ButtonBinding } from "@/types";
import { resolveBindingFlags } from "./fields";

export const DEFAULT_BINDING: ButtonBinding = {
  click: { type: "default" },
  longPress: { type: "disabled" },
  longPressEnabled: false,
  autoClick: false,
};

export const bindingSlot = (binding: ButtonBinding, slot: ActionSlot): Action =>
  slot === "click" ? binding.click : binding.longPress;

export const bindingWithSlot = (
  binding: ButtonBinding,
  slot: ActionSlot,
  action: Action,
): ButtonBinding =>
  slot === "click"
    ? { ...binding, click: action }
    : { ...binding, longPress: action };

export const asBinding = (
  value: Action | ButtonBinding | undefined,
): ButtonBinding => {
  if (value === undefined) {
    return { ...DEFAULT_BINDING };
  }
  if ("click" in value) {
    const flags = resolveBindingFlags(
      {
        click: value.click,
        longPress:
          value.longPress !== undefined
            ? value.longPress
            : { type: "disabled" },
        longPressEnabled: value.longPressEnabled,
        autoClick: value.autoClick,
      },
      {},
    );
    return {
      click: value.click,
      longPress:
        value.longPress !== undefined ? value.longPress : { type: "disabled" },
      ...flags,
    };
  }
  return {
    click: value,
    longPress: { type: "disabled" },
    longPressEnabled: false,
    autoClick: false,
  };
};
export { longPressMs } from "../pointer/speeds";
