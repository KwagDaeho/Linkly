import { KeyChordPills } from "@/components/ui";
import type { Lang } from "@/types";

import * as styles from "./MappingTriggerButton.css";

interface MappingTriggerButtonProps {
  keys: string[] | null;
  lang: Lang;
  unsetLabel: string;
  onClick: () => void;
}

export const MappingTriggerButton = (props: MappingTriggerButtonProps) => {
  const keys = props.keys;
  return (
    <button type="button" className={styles.trigger} onClick={props.onClick}>
      {keys === null || keys.length === 0 ? (
        <span className={styles.unsetChip}>{props.unsetLabel}</span>
      ) : (
        <KeyChordPills lang={props.lang} keys={keys} size="compact" />
      )}
    </button>
  );
};
