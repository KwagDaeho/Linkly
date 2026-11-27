import { useState } from "react";

import {
  readAccordionOpen,
  writeAccordionOpen,
} from "@/services/accordionState";

/** Open/closed flag remembered per `stateKey` (this Mac only). */
export const usePersistedOpen = (
  stateKey: string,
  defaultOpen: boolean,
): [boolean, (next: boolean) => void] => {
  const [open, setOpen] = useState(() =>
    readAccordionOpen(stateKey, defaultOpen),
  );
  const setPersistedOpen = (next: boolean) => {
    setOpen(next);
    writeAccordionOpen(stateKey, next);
  };
  return [open, setPersistedOpen];
};
