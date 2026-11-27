import { applySavedOrder } from "@/domain/list/dragReorder";
import type { DeviceInfoSummary, KeyboardInfo, Profile } from "@/types";
import { hexPid } from "@/utils/format";

import { deviceDisplayName, triggerScopeKey, type TriggerScope } from "./triggerScope";

export type TriggerScopeTab = {
  key: string;
  scope: TriggerScope;
  label: string;
  connected: boolean;
  /** Device tabs: details for the device-info dialog. */
  device?: DeviceInfoSummary;
};

export const COMMON_SCOPE: TriggerScope = { kind: "common" };

/** `"vid-pid"` device key → numeric ids. */
export const parseDeviceKey = (
  deviceKey: string,
): { vendorId: number; productId: number } => {
  const [vendorId, productId] = deviceKey.split("-").map(Number);
  return { vendorId: vendorId!, productId: productId! };
};

/**
 * "Common" first, then connected keyboards plus unplugged ones that still have
 * key-trigger rows, in the saved device order.
 */
export const buildTriggerScopeTabs = (
  profile: Profile,
  keyboards: readonly KeyboardInfo[],
  savedOrder: readonly string[],
  commonLabel: string,
): TriggerScopeTab[] => {
  const tabs: TriggerScopeTab[] = [
    { key: "common", scope: COMMON_SCOPE, label: commonLabel, connected: true },
    ...keyboards.map((k) => ({
      key: k.deviceKey,
      scope: { kind: "device", deviceKey: k.deviceKey } as TriggerScope,
      label: deviceDisplayName(profile, k.deviceKey, k.productName),
      connected: true,
      device: {
        deviceKey: k.deviceKey,
        productName: k.productName,
        vendorId: k.vendorId,
        productId: k.productId,
        connected: true,
      },
    })),
  ];
  // Keyboards with saved device triggers stay listed while unplugged.
  for (const [deviceKey, bundle] of Object.entries(profile.deviceTriggerOverrides ?? {})) {
    const hasKeyRows = (bundle.buttonMappings ?? []).some(
      (entry) => entry.activator?.type === "key",
    );
    if (hasKeyRows && !tabs.some((t) => t.key === deviceKey && t.scope.kind === "device")) {
      const { vendorId, productId } = parseDeviceKey(deviceKey);
      const fallback = `${hexPid(vendorId)}:${hexPid(productId)}`;
      tabs.push({
        key: deviceKey,
        scope: { kind: "device", deviceKey },
        label: deviceDisplayName(profile, deviceKey, fallback),
        connected: false,
        device: {
          deviceKey,
          productName: fallback,
          vendorId,
          productId,
          connected: false,
        },
      });
    }
  }
  // "Common" stays first; device tabs follow the saved order.
  const ordered = applySavedOrder(
    tabs.map((t) => triggerScopeKey(t.scope)),
    ["common", ...savedOrder],
  );
  return tabs.sort((a, b) => ordered.indexOf(a.key) - ordered.indexOf(b.key));
};
