import { ConnectedInputDevices } from "@/components/info";
import { SectionHeading } from "@/components/ui";
import { usePrefs } from "@/hooks";

import * as sectionStyles from "@/components/ui/sectionTitle.css";

export const DevicesTab = () => {
  const { i18n } = usePrefs();

  return (
    <section className={sectionStyles.staticSection}>
      <SectionHeading alignWithAccordion>{i18n.inputDevicesTitle}</SectionHeading>
      <div className={sectionStyles.staticSectionBody}>
        <ConnectedInputDevices />
      </div>
    </section>
  );
};
