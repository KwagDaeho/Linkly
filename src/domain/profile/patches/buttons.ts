import type {
  Action,
  ActionSlot,
  ButtonBinding,
  ButtonId,
  Profile,
} from "@/types";
import { asBinding } from "@/domain/profile";
import { resolveBindingFlags } from "@/domain/profile";
import { isTiltButton } from "@/domain/profile";
import { mirrorCatalogDeviceBinding } from "@/domain/profile/button/syncCatalogDeviceBinding";
export const withButtonSlot = (
  profile: Profile,
  buttonId: ButtonId,
  slot: ActionSlot,
  action: Action,
): Profile => {
  const currentBinding = asBinding(profile.buttons[buttonId]);
  const nextBinding: ButtonBinding =
    slot === "click"
      ? { ...currentBinding, click: action }
      : { ...currentBinding, longPress: action };
  const resolvedBinding =
    slot === "click" && isTiltButton(buttonId)
      ? { ...nextBinding, autoClick: true, longPressEnabled: false }
      : nextBinding;
  return mirrorCatalogDeviceBinding(profile, buttonId, resolvedBinding);
};
export const withButtonFlags = (
  profile: Profile,
  buttonId: ButtonId,
  patch: Partial<Pick<ButtonBinding, "longPressEnabled" | "autoClick">>,
): Profile => {
  const currentBinding = asBinding(profile.buttons[buttonId]);
  const flags = resolveBindingFlags(currentBinding, patch);
  return mirrorCatalogDeviceBinding(profile, buttonId, {
    ...currentBinding,
    ...flags,
  });
};
