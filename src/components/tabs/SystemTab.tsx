import {
  ContactFooter,
  EventViewerLauncher,
  GeneralSettings,
  PermissionPanel,
} from "@/components/info";
import { SectionHeading } from "@/components/ui";
import { usePrefs, useSession } from "@/hooks";

import * as sectionStyles from "@/components/ui/sectionTitle.css";
import { Accordion } from "@/components/ui";
import { accordionStateId } from "@/services/accordionState";

export const SystemTab = () => {
  const { i18n } = usePrefs();
  const { trusted } = useSession();

  return (
    <>
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.sectionGeneral}</SectionHeading>
        <div className={sectionStyles.staticSectionBody}>
          <GeneralSettings />
        </div>
      </section>
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.eventViewer}</SectionHeading>
        <div className={sectionStyles.staticSectionBody}>
          <EventViewerLauncher />
        </div>
      </section>
      {!trusted && (
        <Accordion
          label={i18n.accessibilityTitle}
          defaultOpen
          stateKey={accordionStateId.systemAccessibility}
        >
          <PermissionPanel />
        </Accordion>
      )}
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.sectionAppInfo}</SectionHeading>
        <ContactFooter embedded />
      </section>
    </>
  );
};
