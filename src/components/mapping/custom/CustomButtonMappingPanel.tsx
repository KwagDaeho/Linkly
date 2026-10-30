import { comboDraftEditorFromNewEntry } from "@/domain/editors";
import { scopedCustomMappingsOf } from "@/domain/profile/triggerScope";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { useEditor } from "@/hooks/editor";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Button, Muted, Panel } from "@/components/ui";
import { CustomMappingRow } from "./CustomMappingRow";
import { buttonGrid } from "../button/ButtonMappingPanel.css";
import * as styles from "./CustomButtonMappingPanel.css";

export const CustomButtonMappingPanel = () => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const { scope } = useScopedTriggerApi();
  const { setEditor } = useEditor();
  if (profile === null) {
    return null;
  }
  const entries = scopedCustomMappingsOf(profile, scope);
  return (
    <Panel variant="plain">
      <div className={styles.toolbar}>
        <Button
          className={styles.addButton}
          onClick={() => setEditor(comboDraftEditorFromNewEntry())}
        >
          {i18n.customMappingAdd}
        </Button>
      </div>
      {entries.length === 0 ? (
        <Muted className={styles.empty}>{i18n.customMappingEmpty}</Muted>
      ) : (
        <div className={buttonGrid}>
          <div className={styles.customMappingHead}>
            <span>{i18n.customMappingTrigger}</span>
            <span>{i18n.mappingAction}</span>
            <span aria-hidden />
            <span>{i18n.autoClickEnable}</span>
            <span>{i18n.longPressEnable}</span>
            <span>{i18n.mappingActionLong}</span>
            <span aria-hidden />
          </div>
          {entries.map((entry) => (
            <CustomMappingRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </Panel>
  );
};
