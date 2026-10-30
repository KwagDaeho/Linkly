import { PermissionPanel } from "@/components/info";
import {
  BallScrollPanel,
  ButtonMappingPanel,
  CustomButtonMappingPanel,
  LongPressTimeSetting,
  PointerScrollPanel,
} from "@/components/mapping";
import { Accordion, SectionGroupHeading } from "@/components/ui";
import { accordionStateId } from "@/services/accordionState";
import {
  ballScrollActivatorForSlot,
  ballScrollOf,
  buttonMappingsOf,
  customMappingsOf,
} from "@/domain/profile";
import { formatMappingEntryCount } from "@/i18n";
import { useBallScrollLatch } from "@/hooks/useBallScrollLatch";
import { usePrefs, useProfileCtx, useSession } from "@/hooks";
import { cx } from "@/utils/cx";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const CustomTab = () => {
  const { i18n, lang } = usePrefs();
  const { trusted } = useSession();
  const { profile } = useProfileCtx();
  const latchOn = useBallScrollLatch();

  if (profile === null) {
    return null;
  }

  const onOff = (on: boolean) => (on ? i18n.stateOn : i18n.stateOff);
  const buttonMappingCount = buttonMappingsOf(profile).filter(
    (entry) => entry.activator !== null,
  ).length;
  const comboCount = customMappingsOf(profile).length;
  const ball = ballScrollOf(profile.ballScroll);
  const trackballActive =
    latchOn ||
    ballScrollActivatorForSlot(ball, "toggle") !== null ||
    ballScrollActivatorForSlot(ball, "hold") !== null;

  return (
    <>
      {!trusted && (
        <Accordion
          label={i18n.accessibilityTitle}
          defaultOpen={false}
          stateKey={accordionStateId.linkAccessibility}
        >
          <PermissionPanel />
        </Accordion>
      )}

      <section className={sectionStyles.sectionGroup}>
        <SectionGroupHeading>{i18n.sectionCommon}</SectionGroupHeading>
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
          stateKey={accordionStateId.linkButtonMapping}
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
          stateKey={accordionStateId.linkComboMapping}
        >
          <CustomButtonMappingPanel />
        </Accordion>
        <Accordion
          label={i18n.pointerScroll}
          defaultOpen={false}
          stateKey={accordionStateId.linkPointerScroll}
        >
          <PointerScrollPanel />
        </Accordion>
      </section>

      <section
        className={cx(
          sectionStyles.sectionGroup,
          sectionStyles.sectionGroupFollow,
        )}
      >
        <SectionGroupHeading>{i18n.sectionTrackball}</SectionGroupHeading>
        <Accordion
          label={i18n.ballScroll}
          status={onOff(trackballActive)}
          statusOn={trackballActive}
          defaultOpen={false}
          stateKey={accordionStateId.linkBallScroll}
        >
          <BallScrollPanel />
        </Accordion>
      </section>
    </>
  );
};
