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
}

export const GestureRow = ({ entry, onRedraw, onPick, onRemove }: GestureRowProps) => {
  const { i18n } = usePrefs();
  return (
    <div className={styles.row}>
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
