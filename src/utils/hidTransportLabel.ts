import type { Dict, HidTransport } from "@/types";

export const hidTransportLabel = (
  transport: HidTransport,
  i18n: Dict,
): string | null => {
  switch (transport) {
    case "usb":
      return i18n.inputDeviceTransportUsb;
    case "bluetooth":
      return i18n.inputDeviceTransportBluetooth;
    case "bluetooth_low_energy":
      return i18n.inputDeviceTransportBluetoothLowEnergy;
    case "built_in":
      return i18n.inputDeviceTransportBuiltIn;
    case "virtual":
      return i18n.inputDeviceTransportVirtual;
    default:
      return null;
  }
};
