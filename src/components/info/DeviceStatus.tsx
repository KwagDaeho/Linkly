import { Panel } from "@/components/ui/Panel";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { Toggle } from "../ui/Toggle";

export const DeviceStatus = () => {
  const { i18n } = usePrefs();
  const { profile, lifecycle } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  const loadedProfile = profile;
  const handleRemappingChange = (enabled: boolean) => {
    void lifecycle.persist({ ...loadedProfile, enabled });
  };
  return (
    <Panel variant="row">
      <Toggle
        variant="inline"
        checked={loadedProfile.enabled}
        onChange={handleRemappingChange}
      >
        {i18n.remappingOn}
      </Toggle>
    </Panel>
  );
};
