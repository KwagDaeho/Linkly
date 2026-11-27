import type { Action } from "@/types";
export const actionKey = (action: Action | undefined): string => {
  if (!action) return JSON.stringify({ type: "default" });
  return JSON.stringify(action);
};
