import type { ReorderRowProps } from "@/components/ui/ReorderableList";
import { cx } from "@/utils/cx";
import { BindingRow } from "./BindingRow";
import { buttonMappingActivatorEditorFromEntry } from "@/domain/editors";
import { asBinding, catalogButtonFromActivator } from "@/domain/profile";
import { activatorDisplayKeys } from "@/domain/keys/mouseKeyToken";
import { usePrefs, useEditor } from "@/hooks";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { MappingTriggerButton } from "../MappingTriggerButton";
import { RowRemoveButton } from "../RowRemoveButton";
import type { ButtonMappingEntry } from "@/types";
import * as styles from "../mappingTableRow.css";

interface ButtonMappingRowProps {
  entry: ButtonMappingEntry;
  /** Device scope: re-capture the trigger on that keyboard instead of the global editor. */
  onCaptureTrigger?: () => void;
  /** Drag handle + row state from `ReorderableList`. */
  reorder?: ReorderRowProps;
}

export const ButtonMappingRow = (props: ButtonMappingRowProps) => {
  const { lang, i18n } = usePrefs();
  const { buttonMappings } = useScopedTriggerApi();
  const { catalogSelection, setEditor } = useEditor();
  const entry = props.entry;
  const binding = asBinding(entry);
  const inputKeys = activatorDisplayKeys(entry.activator);
  return (
    <div className={cx(styles.row, props.reorder?.className)} style={props.reorder?.style}>
      {props.reorder?.handle ?? <span aria-hidden />}
      <div className={cx(styles.triggerCell, styles.triggerCellSingleLine)}>
        <MappingTriggerButton
          lang={lang}
          keys={inputKeys}
          unsetLabel={i18n.buttonMappingSetInput}
          onClick={() =>
            props.onCaptureTrigger !== undefined
              ? props.onCaptureTrigger()
              : setEditor(buttonMappingActivatorEditorFromEntry(entry))
          }
        />
      </div>
      <BindingRow
        target={{ kind: "button_mapping", id: entry.id }}
        binding={binding}
        buttonId={catalogButtonFromActivator(entry.activator)}
        onFlags={(patch) => buttonMappings.updateFlags(entry.id, patch)}
        onPick={(slot, value) =>
          catalogSelection.selectButtonMapping(entry.id, slot, value)
        }
      />
      <RowRemoveButton onClick={() => buttonMappings.remove(entry.id)} />
    </div>
  );
};
