import {
  ConnectedInputDevices,
  EventViewerLauncher,
  GeneralSettings,
  PermissionPanel,
} from "@/components/info";
import { Accordion, SectionHeading } from "@/components/ui";
import { usePrefs, useSession } from "@/hooks";
import { accordionStateId } from "@/services/accordionState";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const InfoTab = () => {
  const { i18n } = usePrefs();
  const { trusted } = useSession();

  return (
    <>
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.sectionGeneral}</SectionHeading>
        <div className={sectionStyles.contentIndent}>
          <GeneralSettings />
        </div>
      </section>
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.eventViewer}</SectionHeading>
        <div className={sectionStyles.contentIndent}>
          <EventViewerLauncher />
        </div>
      </section>
      <Accordion
        label={i18n.inputDevicesTitle}
        headingLevel={2}
        defaultOpen
        stateKey={accordionStateId.infoInputDevices}
      >
        <ConnectedInputDevices />
      </Accordion>
      {!trusted && (
        <Accordion
          label={i18n.accessibilityTitle}
          defaultOpen
          stateKey={accordionStateId.infoAccessibility}
        >
          <PermissionPanel />
        </Accordion>
      )}
    </>
  );
};
