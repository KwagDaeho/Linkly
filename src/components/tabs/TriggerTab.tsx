import { useState } from "react";

import {
  CustomButtonMappingPanel,
  ButtonMappingPanel,
  GesturePanel,
  LongPressTimeSetting,
} from "@/components/mapping";
import { Accordion } from "@/components/ui";
import {
  scopedCustomMappingsOf,
  scopedSingleTriggerCount,
} from "@/domain/profile/triggerScope";
import { buildTriggerScopeTabs, COMMON_SCOPE } from "@/domain/profile/triggerTabs";
import { formatMappingEntryCount } from "@/i18n";
import { TriggerScopeProvider } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { useDeviceTabOrder } from "@/hooks/useDeviceTabOrder";
import { useKeyboards } from "@/hooks/useKeyboards";
import { SegmentTabs } from "@/components/layout/SegmentTabs";
import { SlidePages } from "@/components/layout/SlidePages";
import { accordionStateId } from "@/services/accordionState";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const TriggerTab = ({ active }: { active: boolean }) => {
  const { i18n, lang } = usePrefs();
  const { profile } = useProfileCtx();
  const keyboards = useKeyboards(active);
  const [selectedKey, setSelectedKey] = useState<string>("common");
  const [tabOrder, setTabOrder] = useDeviceTabOrder();

  if (profile === null) {
    return null;
  }

  const tabs = buildTriggerScopeTabs(profile, keyboards, tabOrder, i18n.triggerScopeCommon);
  const current = tabs.find((t) => t.key === selectedKey) ?? tabs[0];

  const totalSingle = tabs.reduce(
    (sum, tab) => sum + scopedSingleTriggerCount(profile, tab.scope),
    0,
  );
  const comboCount = scopedCustomMappingsOf(profile, COMMON_SCOPE).length;
  const gestureCount = profile.gestures?.entries?.length ?? 0;

  return (
    <TriggerScopeProvider scope={COMMON_SCOPE}>
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
              active={current.key}
              onSelect={setSelectedKey}
              reorder={{
                lockedIds: ["common"],
                onCommit: (ids) => setTabOrder(ids.filter((id) => id !== "common")),
                startLabel: i18n.tabReorderStart,
                confirmLabel: i18n.tabReorderConfirm,
                cancelLabel: i18n.cancel,
              }}
              items={tabs.map((tab) => {
                const count = scopedSingleTriggerCount(profile, tab.scope);
                return {
                  id: tab.key,
                  label: tab.label,
                  suffix: count > 0 ? count : undefined,
                  muted: !tab.connected,
                };
              })}
            />
          </div>
          <SlidePages
            ids={tabs.map((tab) => tab.key)}
            active={current.key}
            renderPage={(id) => {
              const tab = tabs.find((t) => t.key === id);
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
