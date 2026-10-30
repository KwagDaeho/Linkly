import { longPressMs, withLongPressMs } from "@/domain/profile";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Panel, SettingsList, SettingsRow } from "@/components/ui";
import { ButtonMappingCard } from "./ButtonMappingCard";
import * as styles from "./ButtonMappingPanel.css";

export const ButtonMappingPanel = () => {
  const { i18n } = usePrefs();
  const { profile, catalog, lifecycle } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  return (
    <Panel>
      <SettingsList>
        <SettingsRow>
          <label>
            {i18n.longPressTime} ({longPressMs(profile)} ms)
            <input
              type="range"
              min={150}
              max={2000}
              step={50}
              value={longPressMs(profile)}
              onChange={(event) =>
                void lifecycle.persist(
                  withLongPressMs(profile, Number(event.target.value)),
                )
              }
            />
          </label>
        </SettingsRow>
      </SettingsList>
      <div className={styles.buttonGrid}>
        <div className={styles.buttonHead}>
          <span />
          <span>{i18n.longPressEnable}</span>
          <span>{i18n.autoClickEnable}</span>
          <span>{i18n.clickAction}</span>
          <span>{i18n.longPressAction}</span>
        </div>
        {catalog.map((buttonMeta) => (
          <ButtonMappingCard
            key={buttonMeta.id}
            buttonMeta={buttonMeta}
            profile={profile}
          />
        ))}
      </div>
    </Panel>
  );
};
