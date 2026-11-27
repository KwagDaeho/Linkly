import { ActionSelect } from "@/components/mapping/button/ActionSelect";
import { MappingTriggerButton } from "@/components/mapping/MappingTriggerButton";
import { RowRemoveButton } from "@/components/mapping/RowRemoveButton";
import * as rowStyles from "@/components/mapping/mappingTableRow.css";
import { pill, pillCompact } from "@/components/ui/KeyChordPills.css";
import type { ReorderRowProps } from "@/components/ui/ReorderableList";
import { usePrefs } from "@/hooks";
import type { GestureEntry } from "@/types/profile/gesture";
import { cx } from "@/utils/cx";

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

/** Same row look as the other trigger tables; the shape sits in a trigger pill. */
export const GestureRow = ({ entry, onRedraw, onPick, onRemove, reorder }: GestureRowProps) => {
  const { lang, i18n } = usePrefs();
  return (
    <div
      className={cx(rowStyles.row, styles.gestureColumns, reorder?.className)}
      style={reorder?.style}
    >
      {reorder?.handle ?? <span aria-hidden />}
      <div className={rowStyles.triggerCell}>
        <MappingTriggerButton
          lang={lang}
          keys={null}
          unsetLabel=""
          ariaLabel={i18n.gestureRedraw}
          onClick={onRedraw}
        >
          <span className={cx(pill, pillCompact, styles.shapePill)}>
            <GestureThumbnail points={entry.template} />
          </span>
        </MappingTriggerButton>
      </div>
      <ActionSelect action={entry.click} onPick={onPick} />
      <RowRemoveButton onClick={onRemove} />
    </div>
  );
};
