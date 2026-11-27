import { DEFAULT_BINDING } from "../binding";
import type {
  ButtonBinding,
  ButtonId,
  ButtonMappingEntry,
  Profile,
} from "@/types";

const CATALOG_BUTTON_IDS: ButtonId[] = [
  "left",
  "right",
  "middle",
  "back",
  "forward",
  "fn1",
  "fn2",
  "fn3",
  "wheel_tilt_left",
  "wheel_tilt_right",
];

export const buttonMappingsOf = (profile: Profile): ButtonMappingEntry[] => {
  return profile.buttonMappings ?? [];
};


export const newButtonMappingEntry = (): ButtonMappingEntry => {
  return {
    id: crypto.randomUUID(),
    activator: null,
    ...DEFAULT_BINDING,
  };
};

/** Legacy `profile.buttons` → list rows (once). */
export const migrateLegacyButtonMappings = (profile: Profile): Profile => {
  if (
    profile.buttonMappings !== undefined &&
    profile.buttonMappings.length > 0
  ) {
    return profile;
  }
  const entries: ButtonMappingEntry[] = [];
  for (const id of CATALOG_BUTTON_IDS) {
    const raw = profile.buttons[id];
    if (raw === undefined) {
      continue;
    }
    const binding =
      typeof raw === "object" && raw !== null && "click" in raw
        ? (raw as ButtonBinding)
        : { ...DEFAULT_BINDING, click: raw };
    entries.push({
      id: crypto.randomUUID(),
      activator: { type: "device", button: id },
      ...binding,
    });
  }
  if (entries.length === 0) {
    return { ...profile, buttonMappings: [] };
  }
  return { ...profile, buttonMappings: entries };
};
