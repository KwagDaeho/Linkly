import type { ButtonId } from "../profile";

export type ButtonMeta = {
  id: ButtonId;
  hiddenFromMacos: boolean;
};

export type { InputEventLine } from "./inputEvent";


export type KeyboardInfo = {
  deviceKey: string;
  vendorId: number;
  productId: number;
  productName: string;
};

/** Keyboard shown on a trigger sub-tab (device-info dialog). */
export type DeviceInfoSummary = {
  deviceKey: string;
  productName: string;
  vendorId: number;
  productId: number;
  connected: boolean;
};

export type KeyRemapCapture = { deviceKey: string; usage: number; name: string };

export type InstalledApp = {
  name: string;
  bundleId: string;
  path: string;
};

export type InstalledAppWithIcon = InstalledApp & { icon?: string };
