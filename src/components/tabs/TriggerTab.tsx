import { useState } from "react";

import {
  CustomButtonMappingPanel,
  ButtonMappingPanel,
  GesturePanel,
  LongPressTimeSetting,
} from "@/components/mapping";
import { Accordion } from "@/components/ui";
import {
  deviceDisplayName,
  scopedButtonMappingsOf,
  scopedCustomMappingsOf,
  type TriggerScope,
} from "@/domain/profile/triggerScope";
import { formatMappingEntryCount } from "@/i18n";
import { TriggerScopeProvider } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { useKeyboards } from "@/hooks/useKeyboards";
import { SegmentTabs } from "@/components/layout/SegmentTabs";
import { SlidePages } from "@/components/layout/SlidePages";
import type { DeviceInfoSummary } from "@/components/mapping/button/DeviceInfoModal";
import { accordionStateId } from "@/services/accordionState";
import { readDeviceTabOrder, writeDeviceTabOrder } from "@/services/deviceTabOrder";
import { applySavedOrder } from "@/domain/list/dragReorder";
import { hexPid } from "@/utils/format";
import type { Profile } from "@/types";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

type ScopeTab = {
  scope: TriggerScope;
  label: string;
  connected: boolean;
  /** Device tabs: details for the device-info dialog. */
  device?: DeviceInfoSummary;
};

const COMMON: TriggerScope = { kind: "common" };

const singleTriggerCount = (profile: Profile, scope: TriggerScope): number =>
  scopedButtonMappingsOf(profile, scope).filter((entry) => entry.activator !== null)
    .length;

export const TriggerTab = ({ active }: { active: boolean }) => {
  const { i18n, lang } = usePrefs();
  const { profile } = useProfileCtx();
  const keyboards = useKeyboards(active);
  const [selectedKey, setSelectedKey] = useState<string>("common");
  const [tabOrder, setTabOrder] = useState<string[]>(() => readDeviceTabOrder());

  if (profile === null) {
    return null;
  }

  const tabs: ScopeTab[] = [
    { scope: COMMON, label: i18n.triggerScopeCommon, connected: true },
    ...keyboards.map((k) => ({
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
    if (hasKeyRows && !tabs.some((t) => t.scope.kind === "device" && t.scope.deviceKey === deviceKey)) {
      const [vid, pid] = deviceKey.split("-").map(Number);
      const fallback = `${hexPid(vid)}:${hexPid(pid)}`;
      tabs.push({
        scope: { kind: "device", deviceKey },
        label: deviceDisplayName(profile, deviceKey, fallback),
        connected: false,
        device: {
          deviceKey,
          productName: fallback,
          vendorId: vid,
          productId: pid,
          connected: false,
        },
      });
    }
  }
  const tabKey = (scope: TriggerScope) =>
    scope.kind === "common" ? "common" : scope.deviceKey;
  // "Common" stays first; device tabs follow the saved order.
  const ordered = applySavedOrder(tabs.map((t) => tabKey(t.scope)), ["common", ...tabOrder]);
  tabs.sort((a, b) => ordered.indexOf(tabKey(a.scope)) - ordered.indexOf(tabKey(b.scope)));
  const current = tabs.find((t) => tabKey(t.scope) === selectedKey) ?? tabs[0];

  const totalSingle = tabs.reduce(
    (sum, tab) => sum + singleTriggerCount(profile, tab.scope),
    0,
  );
  const comboCount = scopedCustomMappingsOf(profile, COMMON).length;
  const gestureCount = profile.gestures?.entries?.length ?? 0;

  return (
    <TriggerScopeProvider scope={COMMON}>
      <section className={sectionStyles.sectionGroup}>
        <div className={sectionStyles.staticSectionBody}>
          <LongPressTimeSetting />
        </div>
        <Accordion
          label={i18n.buttonMapping}
          status={totalSingle > 0 ? formatMappingEntryCount(totalSingle, lang) : undefined}
          statusOn={totalSingle > 0}
          defaultOpen={false}
          stateKey={`${accordionStateId.triggerButtonMapping}.common`}
        >
          <div className={sectionStyles.segmentTabsRow}>
            <SegmentTabs
              ariaLabel={i18n.buttonMapping}
              active={tabKey(current.scope)}
              onSelect={setSelectedKey}
              reorder={{
                lockedIds: ["common"],
                onCommit: (ids) => {
                  const devices = ids.filter((id) => id !== "common");
                  setTabOrder(devices);
                  writeDeviceTabOrder(devices);
                },
                startLabel: i18n.tabReorderStart,
                confirmLabel: i18n.tabReorderConfirm,
                cancelLabel: i18n.cancel,
              }}
              items={tabs.map((tab) => {
                const count = singleTriggerCount(profile, tab.scope);
                return {
                  id: tabKey(tab.scope),
                  label: tab.label,
                  suffix: count > 0 ? count : undefined,
                  muted: !tab.connected,
                };
              })}
            />
          </div>
          <SlidePages
            ids={tabs.map((tab) => tabKey(tab.scope))}
            active={tabKey(current.scope)}
            renderPage={(id) => {
              const tab = tabs.find((t) => tabKey(t.scope) === id);
              if (tab === undefined) {
                return null;
              }
              return (
                <TriggerScopeProvider scope={tab.scope}>
                  <ButtonMappingPanel
                    deviceLabel={tab.label}
                    deviceDisconnected={!tab.connected}
                    device={tab.device}
                  />
                </TriggerScopeProvider>
              );
            }}
          />
        </Accordion>
        <Accordion
          label={i18n.comboMapping}
          status={comboCount > 0 ? formatMappingEntryCount(comboCount, lang) : undefined}
          statusOn={comboCount > 0}
          defaultOpen={false}
          stateKey={`${accordionStateId.triggerComboMapping}.common`}
        >
          <CustomButtonMappingPanel />
        </Accordion>
        <Accordion
          label={i18n.gesture}
          status={gestureCount > 0 ? formatMappingEntryCount(gestureCount, lang) : undefined}
          statusOn={gestureCount > 0}
          defaultOpen={false}
          stateKey={accordionStateId.triggerGesture}
        >
          <GesturePanel />
        </Accordion>
      </section>
    </TriggerScopeProvider>
  );
};
