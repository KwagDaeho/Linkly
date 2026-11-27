import { Panel, SettingsList, SettingsRow, Toggle } from "@/components/ui";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useSession } from "@/hooks/session";

export const GeneralSettings = () => {
  const { i18n } = usePrefs();
  const { profile, settings } = useProfileCtx();
  const { autostart } = useSession();
  if (profile === null) {
    return null;
  }
  return (
    <Panel variant="plain">
      <SettingsList>
        <SettingsRow>
          <Toggle
            variant="labelFirst"
            checked={profile.enabled}
            onChange={(enabled) => void settings.setEnabled(enabled)}
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
            checked={profile.startMinimized === true}
            onChange={(startMinimized) =>
              void settings.setStartMinimized(startMinimized)
            }
          >
            {i18n.startMinimized}
          </Toggle>
        </SettingsRow>
      </SettingsList>
    </Panel>
  );
};
