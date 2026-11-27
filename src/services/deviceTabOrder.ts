import { DEVICE_TAB_ORDER_KEY } from "@/constants/storage";

export const readDeviceTabOrder = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEVICE_TAB_ORDER_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export const writeDeviceTabOrder = (ids: string[]): void => {
  try {
    localStorage.setItem(DEVICE_TAB_ORDER_KEY, JSON.stringify(ids));
  } catch {
    // Order just won't persist.
  }
};
