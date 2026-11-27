import type { ButtonMappingEntry, Profile } from "@/types";

/** Spare F-keys relaying device triggers (SSOT: Rust `key_remap::PROXY_KEYS`). */
export const DEVICE_TRIGGER_PROXY_LIMIT = 7;

/** Device rows that cannot be a plain key remap and need a relay key (mirrors Rust `route`). */
const needsProxy = (entry: ButtonMappingEntry): boolean => {
  if (entry.activator?.type !== "key") {
    return false;
  }
  if (entry.longPressEnabled === true || entry.autoClick === true) {
    return true;
  }
  const click = entry.click;
  if (click.type === "default" || click.type === "disabled") {
    return false;
  }
  return !(click.type === "key_stroke" && click.keys.length === 1);
};

export const deviceTriggerProxyCount = (profile: Profile): number =>
  Object.values(profile.deviceTriggerOverrides ?? {})
    .flatMap((bundle) => bundle.buttonMappings ?? [])
    .filter(needsProxy).length;
