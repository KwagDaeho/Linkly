import type { ReactNode } from "react";

import { KeyChordPills } from "@/components/ui";
import type { Lang } from "@/types";

import * as styles from "./MappingTriggerButton.css";

interface MappingTriggerButtonProps {
  keys: string[] | null;
  lang: Lang;
  unsetLabel: string;
  onClick: () => void;
  /** Custom trigger content (e.g. a gesture shape) instead of key pills. */
  children?: ReactNode;
  ariaLabel?: string;
}

export const MappingTriggerButton = (props: MappingTriggerButtonProps) => {
  const keys = props.keys;
  return (
    <button
      type="button"
      className={styles.trigger}
      data-mapping-trigger=""
      data-own-hover="press"
      data-capture-ignore-activator=""
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      {props.children !== undefined ? (
        props.children
      ) : keys === null || keys.length === 0 ? (
        <span className={styles.unsetChip}>{props.unsetLabel}</span>
      ) : (
        <KeyChordPills lang={props.lang} keys={keys} size="compact" />
      )}
    </button>
  );
};
