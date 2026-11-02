import {
  CustomButtonMappingPanel,
  ButtonMappingPanel,
  LongPressTimeSetting,
} from "@/components/mapping";
import { Accordion, SectionGroupHeading } from "@/components/ui";
import {
  deviceDisplayName,
  deviceKeyForStatus,
  listIndividualLinkDeviceKeys,
  scopedButtonMappingsOf,
  scopedCustomMappingsOf,
  type TriggerScope,
} from "@/domain/profile/triggerScope";
import { formatMappingEntryCount } from "@/i18n";
import { TriggerScopeProvider } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { useInputDevices } from "@/hooks/useInputDevices";
import { accordionStateId } from "@/services/accordionState";
import { cx } from "@/utils/cx";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

const TriggerScopeSection = ({
  scope,
  heading,
  className,
}: {
  scope: TriggerScope;
  heading?: string;
  className?: string;
}) => {
  const { i18n, lang } = usePrefs();
  const { profile } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  const buttonMappingCount = scopedButtonMappingsOf(profile, scope).filter(
    (entry) => entry.activator !== null,
  ).length;
  const comboCount = scopedCustomMappingsOf(profile, scope).length;
  const scopeKey =
    scope.kind === "common" ? "common" : scope.deviceKey.replace(/[^a-z0-9_-]/gi, "_");

  return (
    <TriggerScopeProvider scope={scope}>
      <section className={className}>
        {heading ? <SectionGroupHeading>{heading}</SectionGroupHeading> : null}
        <div className={sectionStyles.staticSectionBody}>
          <LongPressTimeSetting />
        </div>
        <Accordion
          label={i18n.buttonMapping}
          status={
            buttonMappingCount > 0
              ? formatMappingEntryCount(buttonMappingCount, lang)
              : undefined
          }
          statusOn={buttonMappingCount > 0}
          defaultOpen={false}
          stateKey={`${accordionStateId.triggerButtonMapping}.${scopeKey}`}
        >
          <ButtonMappingPanel />
        </Accordion>
        <Accordion
          label={i18n.comboMapping}
          status={
            comboCount > 0
              ? formatMappingEntryCount(comboCount, lang)
              : undefined
          }
          statusOn={comboCount > 0}
          defaultOpen={false}
          stateKey={`${accordionStateId.triggerComboMapping}.${scopeKey}`}
        >
          <CustomButtonMappingPanel />
        </Accordion>
      </section>
    </TriggerScopeProvider>
  );
};

export const TriggerTab = () => {
  const { profile } = useProfileCtx();
  const { devices } = useInputDevices();

  if (profile === null) {
    return null;
  }

  const deviceKeys = listIndividualLinkDeviceKeys(profile);
  const deviceSections = deviceKeys.map((deviceKey) => {
    const device = devices.find(
      (row) => deviceKeyForStatus(row.vendorId, row.productId) === deviceKey,
    );
    const fallback = device?.productName ?? deviceKey;
    return {
      deviceKey,
      title: deviceDisplayName(profile, deviceKey, fallback),
    };
  });

  return (
    <>
      <TriggerScopeSection
        scope={{ kind: "common" }}
        className={sectionStyles.sectionGroup}
      />

      {deviceSections.map((section) => (
        <TriggerScopeSection
          key={section.deviceKey}
          scope={{ kind: "device", deviceKey: section.deviceKey }}
          heading={section.title}
          className={cx(
            sectionStyles.sectionGroup,
            sectionStyles.sectionGroupFollow,
          )}
        />
      ))}
    </>
  );
};
