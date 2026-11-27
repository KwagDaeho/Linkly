import type { ReorderRowProps } from "@/components/ui/ReorderableList";
import { cx } from "@/utils/cx";
import { ActionSelect } from "@/components/mapping/button/ActionSelect";
import { Button } from "@/components/ui";
import { usePrefs } from "@/hooks";
import type { GestureEntry } from "@/types/profile/gesture";

import { GestureThumbnail } from "./GestureThumbnail";
import * as styles from "./GesturePanel.css";

interface GestureRowProps {
  entry: GestureEntry;
  onRedraw: () => void;
  onPick: (value: string) => void;
  onRemove: () => void;
  /** Drag handle + row state from `ReorderableList`. */
  reorder?: ReorderRowProps;
}

export const GestureRow = ({ entry, onRedraw, onPick, onRemove, reorder }: GestureRowProps) => {
  const { i18n } = usePrefs();
  return (
    <div className={cx(styles.row, reorder?.className)} style={reorder?.style}>
      {reorder?.handle ?? <span aria-hidden />}
      <button
        type="button"
        className={styles.thumbButton}
        aria-label={i18n.gestureRedraw}
        onClick={onRedraw}
      >
        <GestureThumbnail points={entry.template} />
      </button>
      <ActionSelect action={entry.click} onPick={onPick} />
      <Button variant="remove" size="tiny" onClick={onRemove}>
        {i18n.remove}
      </Button>
    </div>
  );
};
