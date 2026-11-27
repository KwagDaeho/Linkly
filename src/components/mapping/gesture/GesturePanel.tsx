import { useState } from "react";

import { cx } from "@/utils/cx";

import { ActivatorSlotRow } from "../ActivatorSlotRow";
import { Button, Muted, Panel, SettingsList, SettingsRow } from "@/components/ui";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { gestureSettingsOf } from "@/domain/profile/patches/gestures";
import { useEditor } from "@/hooks/editor";
import { usePrefs, useProfileCtx } from "@/hooks";
import type { GesturePoint, GestureSlot } from "@/types/profile/gesture";

import * as panelStyles from "../mappingPanel.css";
import { GestureDrawModal } from "./GestureDrawModal";
import { GestureRow } from "./GestureRow";
import * as styles from "./GesturePanel.css";

/** null id = new gesture. */
type Drawing = { id: string | null; initial?: GesturePoint[] };

export const GesturePanel = () => {
  const { i18n } = usePrefs();
  const { profile, gestures: gestureMutations } = useProfileCtx();
  const { setEditor, catalogSelection } = useEditor();
  const [drawing, setDrawing] = useState<Drawing | null>(null);
  if (profile === null) {
    return null;
  }
  const gestures = gestureSettingsOf(profile);

  const keyRow = (slot: GestureSlot) => {
    const isToggle = slot === "toggle";
    return (
      <ActivatorSlotRow
        label={isToggle ? i18n.ballScrollToggle : i18n.ballScrollHold}
        helpText={isToggle ? i18n.gestureToggleHelp : i18n.gestureHoldHelp}
        activator={isToggle ? gestures.toggleActivator : gestures.holdActivator}
        onOpenCapture={() =>
          setEditor({ kind: "ball_scroll_activator", slot, target: "gesture", rejected: null })
        }
        onClear={() => gestureMutations.setActivator(slot, null)}
      />
    );
  };

  const save = (points: GesturePoint[]) => {
    const target = drawing;
    setDrawing(null);
    if (target === null) {
      return;
    }
    if (target.id === null) {
      gestureMutations.add(points);
    } else {
      gestureMutations.redraw(target.id, points);
    }
  };

  return (
    <Panel variant="plain">
      <Muted as="p" className={styles.description}>
        {i18n.gestureDesc}
      </Muted>
      {/* Same layout as the Mouse tab's ball-scroll keys. */}
      <SettingsList className={styles.keys}>
        <SettingsRow stack>{keyRow("toggle")}</SettingsRow>
        <SettingsRow stack>{keyRow("hold")}</SettingsRow>
      </SettingsList>
      <div className={panelStyles.toolbar}>
        <Button className={panelStyles.addButton} onClick={() => setDrawing({ id: null })}>
          {i18n.customMappingAdd}
        </Button>
      </div>
      {gestures.entries.length === 0 ? (
        <Muted className={panelStyles.empty}>{i18n.gestureEmpty}</Muted>
      ) : (
        <div className={panelStyles.table}>
          <div className={cx(panelStyles.tableHead, styles.gestureColumns)}>
            <span aria-hidden />
            <span>{i18n.gestureShape}</span>
            <span>{i18n.mappingAction}</span>
            <span aria-hidden />
          </div>
          <ReorderableList
            items={gestures.entries}
            getKey={(entry) => entry.id}
            onReorder={gestureMutations.move}
            hint={i18n.reorderHint}
            className={panelStyles.tableRows}
            renderRow={(entry, _index, reorder) => (
              <GestureRow
                entry={entry}
                reorder={reorder}
                onRedraw={() => setDrawing({ id: entry.id, initial: entry.template })}
                onPick={(value) => catalogSelection.selectGesture(entry.id, value)}
                onRemove={() => gestureMutations.remove(entry.id)}
              />
            )}
          />
        </div>
      )}
      {drawing !== null ? (
        <GestureDrawModal
          initial={drawing.initial}
          ready={gestures.holdActivator != null || gestures.toggleActivator != null}
          onSave={save}
          onClose={() => setDrawing(null)}
        />
      ) : null}
    </Panel>
  );
};
