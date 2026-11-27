import { comboDraftEditorFromNewEntry } from "@/domain/editors";
import { scopedCustomMappingsOf } from "@/domain/profile/triggerScope";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { useEditor } from "@/hooks/editor";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Button, Muted, Panel } from "@/components/ui";
import { CustomMappingRow } from "./CustomMappingRow";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { MappingTableHead } from "../MappingTableHead";
import * as styles from "../mappingPanel.css";

export const CustomButtonMappingPanel = () => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const { scope, customMappings } = useScopedTriggerApi();
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
        <div className={styles.table}>
          <MappingTableHead inputLabel={i18n.customMappingTrigger} />
          <ReorderableList
            items={entries}
            getKey={(entry) => entry.id}
            onReorder={customMappings.move}
            hint={i18n.reorderHint}
            className={styles.tableRows}
            renderRow={(entry, _index, reorder) => (
              <CustomMappingRow entry={entry} reorder={reorder} />
            )}
          />
        </div>
      )}
    </Panel>
  );
};
