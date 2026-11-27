import { formatMacroStepLabel } from "@/i18n";
import { cx } from "@/utils/cx";
import { Button } from "@/components/ui";
import { OverlayScrollArea } from "@/components/layout/OverlayScrollArea";
import { DragHandle } from "@/components/ui/DragHandle";
import type { Lang, MacroStep } from "@/types";

import { moveItem } from "@/domain/list/dragReorder";
import { useDragReorder } from "@/hooks/useDragReorder";
import * as reorder from "@/components/ui/reorder.css";

import { isEditableStep } from "@/domain/editors";
import * as styles from "./MacroStepList.css";

interface MacroStepListProps {
  steps: MacroStep[];
  lang: Lang;
  editLabel: string;
  removeLabel: string;
  reorderHint: string;
  onStepsChange: (steps: MacroStep[]) => void;
  onEditStep?: (index: number) => void;
}

export const MacroStepList = (props: MacroStepListProps) => {
  const { bindList, dragging, handleProps, rowState } = useDragReorder({
    count: props.steps.length,
    onReorder: (from, to) => props.onStepsChange(moveItem(props.steps, from, to)),
  });

  return (
    <OverlayScrollArea
      className={styles.stepsArea}
      contentKey={String(props.steps.length)}
    >
      <ul
        ref={bindList}
        aria-label={props.reorderHint}
        className={cx(styles.list, dragging && reorder.listDragging)}
      >
        {props.steps.map((step, stepIndex) => {
          const row = rowState(stepIndex);
          const editable = isEditableStep(step) && props.onEditStep;

          return (
            <li
              key={stepIndex}
              className={cx(
                styles.stepItem,
                row.highlighted && reorder.rowHighlighted,
                row.dragging && reorder.rowDragging,
              )}
              style={row.style}
            >
              <DragHandle
                className={styles.dragZone}
                label={props.reorderHint}
                {...handleProps(stepIndex)}
              >
                <span className={styles.order}>{stepIndex + 1}</span>
              </DragHandle>
              <span className={styles.label}>
                {formatMacroStepLabel(step, props.lang)}
              </span>
              <div className={styles.actions}>
                {editable ? (
                  <Button
                    variant="ghost"
                    size="tiny"
                    onClick={() => props.onEditStep?.(stepIndex)}
                  >
                    {props.editLabel}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="tiny"
                  onClick={() =>
                    props.onStepsChange(
                      props.steps.filter((_, index) => index !== stepIndex),
                    )
                  }
                >
                  {props.removeLabel}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </OverlayScrollArea>
  );
};
