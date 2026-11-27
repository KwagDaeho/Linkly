import {
  ContactFooter,
  EventViewerLauncher,
  GeneralSettings,
  PermissionPanel,
} from "@/components/info";
import { StaticSection } from "@/components/ui";
import { usePrefs, useSession } from "@/hooks";

export const SystemTab = () => {
  const { i18n } = usePrefs();
  const { permissionGateVisible } = useSession();

  return (
    <>
      {!permissionGateVisible ? null : (
        <StaticSection title={i18n.accessibilityTitle}>
          <PermissionPanel />
        </StaticSection>
      )}
      <StaticSection title={i18n.sectionGeneral}>
        <GeneralSettings />
      </StaticSection>
      <StaticSection title={i18n.eventViewer}>
        <EventViewerLauncher />
      </StaticSection>
      <StaticSection title={i18n.sectionAppInfo}>
        <ContactFooter />
      </StaticSection>
    </>
  );
};
