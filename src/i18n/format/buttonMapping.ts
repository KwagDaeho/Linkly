import { buttonMappingActivatorValid } from "@/domain/profile";
import { formatActivator } from "./activators";
import type { ButtonMappingEntry, Lang } from "@/types";

export const buttonMappingInputLabel = (
  entry: ButtonMappingEntry,
  lang: Lang,
  unsetLabel: string,
): string => {
  if (!buttonMappingActivatorValid(entry.activator)) {
    return unsetLabel;
  }
  return formatActivator(entry.activator, lang);
};
