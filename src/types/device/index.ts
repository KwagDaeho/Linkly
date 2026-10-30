import type { ButtonId } from "../profile";

export type HidTransport =
  | "unknown"
  | "usb"
  | "bluetooth"
  | "bluetooth_low_energy"
  | "built_in"
  | "virtual";

export type InputDeviceStatus = DeviceInfo & {
  connected: boolean;
  profileTarget: boolean;
  activeTransport: HidTransport | null;
  knownTransports: HidTransport[];
};

export type DeviceInfo = {
  vendorId: number;
  productId: number;
  productName: string;
  manufacturer: string;
  path: string;
  isHuge: boolean;
  transport: HidTransport;
};

export type ButtonMeta = {
  id: ButtonId;
  hiddenFromMacos: boolean;
};

export type { InputEventLine } from "./inputEvent";

export type LastReport = {
  hex: string;
  buttons: string[];
  dx: number;
  dy: number;
  wheel: number;
  pan: number;
  ignored: boolean;
  tsMs: number;
};

export type InstalledApp = {
  name: string;
  bundleId: string;
  path: string;
};

export type InstalledAppWithIcon = InstalledApp & { icon?: string };
