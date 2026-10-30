const STORAGE_KEY = "linkly-accordion-open";
const LEGACY_PREFIX = "elecom-huge-accordion-open";

const readMap = (): Record<string, boolean> => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_PREFIX);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") {
      return {};
    }
    const map: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") {
        map[key] = value;
      }
    }
    return map;
  } catch {
    return {};
  }
};

export const readAccordionOpen = (id: string, fallback: boolean): boolean => {
  const map = readMap();
  return id in map ? map[id]! : fallback;
};

export const writeAccordionOpen = (id: string, open: boolean): void => {
  try {
    const map = readMap();
    map[id] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
};

/** Stable ids for persisted accordion open state. */
export const accordionStateId = {
  infoInputDevices: "info.inputDevices",
  infoAccessibility: "info.accessibility",
  linkAccessibility: "link.accessibility",
  linkButtonMapping: "link.buttonMapping",
  linkPointerScroll: "link.pointerScroll",
  linkComboMapping: "link.comboMapping",
  linkBallScroll: "link.ballScroll",
} as const;
