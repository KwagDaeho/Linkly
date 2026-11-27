import { formatActivator } from "@/i18n";
import { Button, Muted } from "@/components/ui";
import type { Activator, Lang } from "@/types";
import * as styles from "./BallScrollActivatorRow.css";

interface ActivatorSlotRowProps {
  label: string;
  helpText: string;
  activator: Activator | null;
  lang: Lang;
  emptyLabel: string;
  clearLabel: string;
  onOpenCapture: () => void;
  onClear: () => void;
}

/** Hold / toggle key row (ball scroll, gestures). */
export const ActivatorSlotRow = (props: ActivatorSlotRowProps) => (
  <div className={styles.row}>
    <span className={styles.label}>{props.label}</span>
    <div className={styles.key}>
      <Button size="tiny" onClick={props.onOpenCapture}>
        {props.activator !== null
          ? formatActivator(props.activator, props.lang)
          : props.emptyLabel}
      </Button>
      {props.activator !== null ? (
        <Button variant="ghost" size="tiny" onClick={props.onClear}>
          {props.clearLabel}
        </Button>
      ) : null}
    </div>
    <Muted as="p" className={styles.help}>
      {props.helpText}
    </Muted>
  </div>
);
