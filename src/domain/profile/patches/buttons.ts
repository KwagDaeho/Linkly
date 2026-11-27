import type { Action, ActionSlot, ButtonId, Profile } from "@/types";
import {
  asBinding,
  bindingWithSlot,
  enforceTiltBindingFlags,
  isTiltButton,
} from "@/domain/profile";
import { mirrorCatalogDeviceBinding } from "@/domain/profile/button/syncCatalogDeviceBinding";

export const withButtonSlot = (
  profile: Profile,
  buttonId: ButtonId,
  slot: ActionSlot,
  action: Action,
): Profile => {
  const nextBinding = bindingWithSlot(
    asBinding(profile.buttons[buttonId]),
    slot,
    action,
  );
  const resolvedBinding =
    slot === "click" && isTiltButton(buttonId)
      ? enforceTiltBindingFlags(nextBinding)
      : nextBinding;
  return mirrorCatalogDeviceBinding(profile, buttonId, resolvedBinding);
};
