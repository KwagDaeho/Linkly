import type { Dict, HidTransport } from "@/types";
import { hidTransportLabel } from "@/utils/hidTransportLabel";

export type TransportChip = {
  transport: HidTransport;
  label: string;
  active: boolean;
};

const transportOrder = (t: HidTransport): number => {
  switch (t) {
    case "usb":
      return 0;
    case "bluetooth_low_energy":
      return 1;
    case "bluetooth":
      return 2;
    default:
      return 9;
  }
};

export const buildTransportChips = (
  knownTransports: HidTransport[],
  activeTransport: HidTransport | null | undefined,
  i18n: Dict,
): TransportChip[] => {
  const physical = knownTransports.filter(
    (t) =>
      t === "usb" ||
      t === "bluetooth" ||
      t === "bluetooth_low_energy",
  );
  const sorted = [...physical].sort(
    (a, b) => transportOrder(a) - transportOrder(b),
  );
  const unique = sorted.filter((t, i) => sorted.indexOf(t) === i);

  if (unique.length === 0) {
    const fallback = hidTransportLabel(activeTransport ?? "unknown", i18n);
    if (!fallback) return [];
    return [
      {
        transport: activeTransport ?? "unknown",
        label: fallback,
        active: activeTransport != null,
      },
    ];
  }

  return unique.map((transport) => ({
    transport,
    label: hidTransportLabel(transport, i18n) ?? transport,
    active: activeTransport === transport,
  }));
};
