import { normalizeKeys } from "@/domain/keys";
import { formatKeyTokenLabel } from "@/i18n/format/keys";
import type { Lang } from "@/types";

import { cx } from "@/utils/cx";

import * as styles from "./KeyChordPills.css";

interface KeyChordPillsProps {
  keys: string[];
  lang: Lang;
  prefix?: string;
  size?: "default" | "compact";
  /** Table rows default to start; modal capture fields use center. */
  align?: "start" | "center";
}

export const KeyChordPills = (props: KeyChordPillsProps) => {
  const compact = props.size === "compact";
  const align = props.align ?? "start";
  const tokens = normalizeKeys(props.keys);
  if (tokens.length === 0 && props.prefix === undefined) {
    return null;
  }
  return (
    <div
      className={cx(
        styles.row,
        compact &&
          (align === "center" ? styles.rowCompactCenter : styles.rowCompact),
      )}
    >
      {props.prefix !== undefined ? (
        <span className={cx(styles.prefix, compact && styles.prefixCompact)}>
          {props.prefix}
        </span>
      ) : null}
      {tokens.map((token) => (
        <span
          key={token}
          className={cx(styles.pill, compact && styles.pillCompact)}
        >
          {formatKeyTokenLabel(token, props.lang)}
        </span>
      ))}
    </div>
  );
};
