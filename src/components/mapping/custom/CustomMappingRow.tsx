import { BindingRow } from "../button/BindingRow";
import { asBinding, catalogButtonFromComboTrigger } from "@/domain/profile";
import { comboActivatorToSnapshot } from "@/domain/capture";
import { comboEditorStateFromEntry } from "@/domain/editors";
import { comboIsValid } from "@/domain/profile";
import { usePrefs, useEditor } from "@/hooks";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { Button } from "@/components/ui";
import { MappingTriggerButton } from "../MappingTriggerButton";
import type { CustomMappingEntry } from "@/types";
import * as styles from "./CustomMappingRow.css";

interface CustomMappingRowProps {
  entry: CustomMappingEntry;
}

export const CustomMappingRow = (props: CustomMappingRowProps) => {
  const { lang, i18n } = usePrefs();
  const { customMappings } = useScopedTriggerApi();
  const { catalogSelection, setEditor } = useEditor();
  const entry = props.entry;
  const binding = asBinding(entry);
  const triggerKeys = comboIsValid(entry.activator)
    ? comboActivatorToSnapshot(entry.activator)
    : null;
  return (
    <div className={styles.row}>
      <div className={styles.comboTrigger}>
        <MappingTriggerButton
          lang={lang}
          keys={triggerKeys}
          unsetLabel={i18n.customMappingSetTrigger}
          onClick={() => setEditor(comboEditorStateFromEntry(entry))}
        />
      </div>
      <BindingRow
        target={{ kind: "custom", id: entry.id }}
        binding={binding}
        label={null}
        hideLabel
        buttonId={catalogButtonFromComboTrigger(entry.activator)}
        onFlags={(patch) => customMappings.updateFlags(entry.id, patch)}
        onPick={(slot, value) =>
          catalogSelection.selectCustom(entry.id, slot, value)
        }
      />
      <div className={styles.remove}>
        <Button
          variant="remove"
          size="tiny"
          onClick={() => void customMappings.remove(entry.id)}
        >
          {i18n.remove}
        </Button>
      </div>
    </div>
  );
};
