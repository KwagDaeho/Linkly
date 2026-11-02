import {
  ContactFooter,
  EventViewerLauncher,
  GeneralSettings,
  PermissionPanel,
} from "@/components/info";
import { SectionHeading } from "@/components/ui";
import { usePrefs, useSession } from "@/hooks";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const SystemTab = () => {
  const { i18n } = usePrefs();
  const { permissionGateVisible } = useSession();

  return (
    <>
      {!permissionGateVisible ? null : (
        <section className={sectionStyles.staticSection}>
          <SectionHeading alignWithAccordion>
            {i18n.accessibilityTitle}
          </SectionHeading>
          <div className={sectionStyles.staticSectionBody}>
            <PermissionPanel />
          </div>
        </section>
      )}
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
      <section className={sectionStyles.staticSection}>
        <SectionHeading alignWithAccordion>{i18n.sectionAppInfo}</SectionHeading>
        <div className={sectionStyles.staticSectionBody}>
          <ContactFooter embedded />
        </div>
      </section>
    </>
  );
};
