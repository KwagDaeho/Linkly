import { useState } from "react";

import { readDeviceTabOrder, writeDeviceTabOrder } from "@/services/deviceTabOrder";

/** Saved order of device trigger tabs (this Mac only). */
export const useDeviceTabOrder = (): [string[], (ids: string[]) => void] => {
  const [order, setOrder] = useState<string[]>(() => readDeviceTabOrder());
  const saveOrder = (ids: string[]) => {
    setOrder(ids);
    writeDeviceTabOrder(ids);
  };
  return [order, saveOrder];
};
