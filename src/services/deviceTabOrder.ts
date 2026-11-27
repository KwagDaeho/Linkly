/** Single-trigger device tab order (UI preference, this Mac only). */
const STORAGE_KEY = "linkly-device-tab-order";

export const readDeviceTabOrder = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export const writeDeviceTabOrder = (ids: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Order just won't persist.
  }
};
