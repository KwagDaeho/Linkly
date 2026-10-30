import { BindingRow } from "./BindingRow";
import { buttonMappingActivatorEditorFromEntry } from "@/domain/editors";
import { asBinding } from "@/domain/profile";
import { activatorToCaptureToken } from "@/domain/keys/mouseKeyToken";
import { buttonMappingActivatorValid } from "@/domain/profile";
import { usePrefs, useProfileCtx, useEditor } from "@/hooks";
import { Button } from "@/components/ui";
import { MappingTriggerButton } from "../MappingTriggerButton";
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
  const inputKeys =
    entry.activator !== null && buttonMappingActivatorValid(entry.activator)
      ? (() => {
          const token = activatorToCaptureToken(entry.activator);
          return token !== null ? [token] : null;
        })()
      : null;
  const resolvedButtonId = hugeButtonId(entry);
  return (
    <div className={styles.row}>
      <div className={styles.inputCell}>
        <MappingTriggerButton
          lang={lang}
          keys={inputKeys}
          unsetLabel={i18n.buttonMappingSetInput}
          onClick={() =>
            setEditor(buttonMappingActivatorEditorFromEntry(entry))
          }
        />
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
          variant="remove"
          size="tiny"
          onClick={() => void buttonMappings.remove(entry.id)}
        >
          {i18n.remove}
        </Button>
      </div>
    </div>
  );
};
