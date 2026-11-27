import { scopedLongPressMs } from "@/domain/profile/triggerScope";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { RangeField, SettingsList, SettingsRow } from "@/components/ui";
import * as styles from "./LongPressTimeSetting.css";

export const LongPressTimeSetting = () => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const { scope, persistLongPressMs } = useScopedTriggerApi();
  if (profile === null) {
    return null;
  }
  const ms = scopedLongPressMs(profile, scope);
  return (
    <SettingsList className={styles.root}>
      <SettingsRow stack>
        <RangeField
          label={i18n.longPressTime}
          display={`(${ms} ms)`}
          min={150}
          max={2000}
          step={50}
          value={ms}
          onChange={(next) => void persistLongPressMs(next)}
        />
      </SettingsRow>
    </SettingsList>
  );
};
