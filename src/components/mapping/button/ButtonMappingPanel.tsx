import { longPressMs, withLongPressMs } from "@/domain/profile";
import {
  buttonMappingsOf,
  newButtonMappingEntry,
} from "@/domain/profile";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Button, Muted, Panel, SettingsList, SettingsRow } from "@/components/ui";
import { ButtonMappingRow } from "./ButtonMappingRow";
import { buttonGrid } from "./ButtonMappingPanel.css";
import * as styles from "../custom/CustomButtonMappingPanel.css";

export const ButtonMappingPanel = () => {
  const { i18n } = usePrefs();
  const { profile, buttonMappings, lifecycle } = useProfileCtx();
  if (profile === null) {
    return null;
  }
  const entries = buttonMappingsOf(profile);
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
      <div className={styles.toolbar}>
        <Button
          className={styles.addButton}
          onClick={() => void buttonMappings.add(newButtonMappingEntry())}
        >
          {i18n.customMappingAdd}
        </Button>
      </div>
      {entries.length === 0 ? (
        <Muted className={styles.empty}>{i18n.buttonMappingEmpty}</Muted>
      ) : (
        <div className={buttonGrid}>
          <div className={styles.customMappingHead}>
            <span>{i18n.buttonMappingInput}</span>
            <span>{i18n.mappingAction}</span>
            <span aria-hidden />
            <span>{i18n.autoClickEnable}</span>
            <span>{i18n.longPressEnable}</span>
            <span>{i18n.mappingActionLong}</span>
            <span>{i18n.remove}</span>
          </div>
          {entries.map((entry) => (
            <ButtonMappingRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </Panel>
  );
};
