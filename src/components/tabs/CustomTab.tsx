import { PermissionPanel } from "@/components/info";
import {
  BallScrollPanel,
  ButtonMappingPanel,
  CustomButtonMappingPanel,
  PointerScrollPanel,
} from "@/components/mapping";
import { Accordion, SectionGroupHeading } from "@/components/ui";
import { accordionStateId } from "@/services/accordionState";
import { ballScrollOf, customMappingsOf } from "@/domain/profile";
import { useBallScrollLatch } from "@/hooks/useBallScrollLatch";
import { usePrefs, useProfileCtx, useSession } from "@/hooks";
import { cx } from "@/utils/cx";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const CustomTab = () => {
  const { i18n } = usePrefs();
  const { trusted } = useSession();
  const { profile } = useProfileCtx();
  const latchOn = useBallScrollLatch();

  if (profile === null) {
    return null;
  }

  const onOff = (on: boolean) => (on ? i18n.stateOn : i18n.stateOff);
  const comboCount = customMappingsOf(profile).length;
  const ball = ballScrollOf(profile.ballScroll);
  const trackballActive =
    latchOn || ball.toggleEnabled || ball.holdEnabled;

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
        <Accordion
          label={i18n.buttonMapping}
          defaultOpen={false}
          stateKey={accordionStateId.linkButtonMapping}
        >
          <ButtonMappingPanel />
        </Accordion>
        <Accordion
          label={i18n.pointerScroll}
          defaultOpen={false}
          stateKey={accordionStateId.linkPointerScroll}
        >
          <PointerScrollPanel />
        </Accordion>
        <Accordion
          label={i18n.comboMapping}
          status={comboCount > 0 ? String(comboCount) : undefined}
          statusOn={comboCount > 0}
          defaultOpen={false}
          stateKey={accordionStateId.linkComboMapping}
        >
          <CustomButtonMappingPanel />
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
