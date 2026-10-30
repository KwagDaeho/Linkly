import { BindingRow } from "./BindingRow";
import { asBinding } from "@/domain/profile";
import { buttonMappingInputLabel } from "@/i18n";
import { usePrefs, useProfileCtx, useEditor } from "@/hooks";
import { Button } from "@/components/ui";
import type { ButtonId, ButtonMappingEntry } from "@/types";
import * as styles from "./ButtonMappingRow.css";

interface ButtonMappingRowProps {
  entry: ButtonMappingEntry;
}

const hugeButtonId = (entry: ButtonMappingEntry): ButtonId | undefined => {
  if (entry.activator?.type === "huge") {
    return entry.activator.button;
  }
  return undefined;
};

export const ButtonMappingRow = (props: ButtonMappingRowProps) => {
  const { lang, i18n } = usePrefs();
  const { buttonMappings } = useProfileCtx();
  const { catalogSelection, setEditor } = useEditor();
  const entry = props.entry;
  const binding = asBinding(entry);
  const inputLabel = buttonMappingInputLabel(
    entry,
    lang,
    i18n.buttonMappingSetInput,
  );
  const resolvedButtonId = hugeButtonId(entry);
  return (
    <div className={styles.row}>
      <div className={styles.inputCell}>
        <Button
          size="tiny"
          onClick={() =>
            setEditor({
              kind: "button_mapping_activator",
              entryId: entry.id,
              rejected: null,
            })
          }
        >
          {inputLabel}
        </Button>
      </div>
      <BindingRow
        target={{ kind: "button_mapping", id: entry.id }}
        binding={binding}
        label={null}
        hideLabel
        buttonId={resolvedButtonId}
        onFlags={(patch) => buttonMappings.updateFlags(entry.id, patch)}
        onPick={(slot, value) =>
          catalogSelection.selectButtonMapping(entry.id, slot, value)
        }
      />
      <div className={styles.remove}>
        <Button
          variant="ghost"
          size="tiny"
          onClick={() => void buttonMappings.remove(entry.id)}
        >
          {i18n.remove}
        </Button>
      </div>
    </div>
  );
};
