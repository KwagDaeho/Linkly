import { Panel, SettingsList, SettingsRow, Toggle } from "@/components/ui";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useSession } from "@/hooks/session";

export const GeneralSettings = () => {
  const { i18n } = usePrefs();
  const { profile, lifecycle } = useProfileCtx();
  const { autostart } = useSession();
  if (profile === null) {
    return null;
  }
  const loadedProfile = profile;
  return (
    <Panel variant="plain">
      <SettingsList>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={loadedProfile.enabled}
            onChange={(enabled) =>
              void lifecycle.persist({ ...loadedProfile, enabled })
            }
          >
            {i18n.remappingOn}
          </Toggle>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={autostart.enabled}
            onChange={(enabled) => void autostart.setEnabled(enabled)}
          >
            {i18n.launchAtLogin}
          </Toggle>
        </SettingsRow>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={loadedProfile.startMinimized === true}
            onChange={(startMinimized) =>
              void lifecycle.persist({ ...loadedProfile, startMinimized })
            }
          >
            {i18n.startMinimized}
          </Toggle>
        </SettingsRow>
      </SettingsList>
    </Panel>
  );
};
