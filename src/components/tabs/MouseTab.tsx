import {
  BallScrollPanel,
  PointerScrollPanel,
} from "@/components/mapping";
import { Accordion, SectionGroupHeading } from "@/components/ui";
import { accordionStateId } from "@/services/accordionState";
import {
  ballScrollActivatorForSlot,
  ballScrollOf,
} from "@/domain/profile";
import { useBallScrollLatch } from "@/hooks/useBallScrollLatch";
import { usePrefs, useProfileCtx } from "@/hooks";
import { cx } from "@/utils/cx";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const MouseTab = () => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const latchOn = useBallScrollLatch();

  if (profile === null) {
    return null;
  }

  const onOff = (on: boolean) => (on ? i18n.stateOn : i18n.stateOff);
  const ball = ballScrollOf(profile.ballScroll);
  const trackballActive =
    latchOn ||
    ballScrollActivatorForSlot(ball, "toggle") !== null ||
    ballScrollActivatorForSlot(ball, "hold") !== null;

  return (
    <>
      <section className={sectionStyles.sectionGroup}>
        <SectionGroupHeading>{i18n.sectionMouse}</SectionGroupHeading>
        <Accordion
          label={i18n.pointerScroll}
          defaultOpen={false}
          stateKey={accordionStateId.mousePointerScroll}
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
          stateKey={accordionStateId.mouseBallScroll}
        >
          <BallScrollPanel />
        </Accordion>
      </section>
    </>
  );
};
