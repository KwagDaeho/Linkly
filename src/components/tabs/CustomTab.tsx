import { PermissionPanel } from "@/components/info";
import {
  BallScrollPanel,
  ButtonMappingPanel,
  CustomButtonMappingPanel,
  PointerScrollPanel,
} from "@/components/mapping";
import { Accordion, MappingGroup } from "@/components/ui";
import { usePrefs, useSession } from "@/hooks";

export const CustomTab = () => {
  const { i18n } = usePrefs();
  const { trusted } = useSession();
  return (
    <>
      {!trusted && <PermissionPanel />}
      <MappingGroup title={i18n.sectionCommon}>
        <ButtonMappingPanel />
        <PointerScrollPanel />
        <CustomButtonMappingPanel />
      </MappingGroup>
      <Accordion title={i18n.sectionTrackball} summary={i18n.sectionTrackballSummary}>
        <BallScrollPanel />
      </Accordion>
    </>
  );
};
