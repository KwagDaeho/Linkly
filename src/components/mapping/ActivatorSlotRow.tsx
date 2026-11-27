import { formatActivator } from "@/i18n";
import { Button, Muted } from "@/components/ui";
import { usePrefs } from "@/hooks";
import type { Activator } from "@/types";
import * as styles from "./ActivatorSlotRow.css";

interface ActivatorSlotRowProps {
  label: string;
  helpText: string;
  activator: Activator | null;
  onOpenCapture: () => void;
  onClear: () => void;
}

/** Hold / toggle key row (ball scroll, gestures). */
export const ActivatorSlotRow = (props: ActivatorSlotRowProps) => {
  const { lang, i18n } = usePrefs();
  return (
    <div className={styles.row}>
      <span className={styles.label}>{props.label}</span>
      <div className={styles.key}>
        <Button size="tiny" onClick={props.onOpenCapture}>
          {props.activator !== null
            ? formatActivator(props.activator, lang)
            : i18n.ballScrollKey}
        </Button>
        {props.activator !== null ? (
          <Button variant="ghost" size="tiny" onClick={props.onClear}>
            {i18n.clear}
          </Button>
        ) : null}
      </div>
      <Muted as="p" className={styles.help}>
        {props.helpText}
      </Muted>
    </div>
  );
};
