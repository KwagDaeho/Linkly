import type { Lang } from "@/types";

export const formatMappingEntryCount = (count: number, lang: Lang): string => {
  if (lang === "ko") {
    return `${count}개`;
  }
  return count === 1 ? "1 item" : `${count} items`;
};
