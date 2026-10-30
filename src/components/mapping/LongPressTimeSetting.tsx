import { longPressMs, withLongPressMs } from "@/domain/profile";
import { usePrefs, useProfileCtx } from "@/hooks";
import { SettingsList, SettingsRow } from "@/components/ui";
import * as styles from "./LongPressTimeSetting.css";

export const LongPressTimeSetting = () => {
  const { i18n } = usePrefs();
  const { profile, lifecycle } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  return (
    <SettingsList className={styles.root}>
      <SettingsRow stack>
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
  );
};
