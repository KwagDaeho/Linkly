import { useState } from "react";

import { ActivatorSlotRow } from "@/components/mapping/ballScroll";
import { Button, Muted, Panel } from "@/components/ui";
import { ReorderableList } from "@/components/ui/ReorderableList";
import {
  gestureSettingsOf,
  withGestureAdded,
  withGestureMoved,
  withGesturePatch,
  withGestureRemoved,
  withGestureTemplate,
} from "@/domain/profile/patches/gestures";
import { useEditor } from "@/hooks/editor";
import { usePrefs, useProfileCtx } from "@/hooks";
import { applyCatalogSelection } from "@/services/catalogSelection";
import type { GesturePoint, GestureSlot } from "@/types/profile/gesture";

import * as panelStyles from "../custom/CustomButtonMappingPanel.css";
import { GestureDrawModal } from "./GestureDrawModal";
import { GestureRow } from "./GestureRow";
import * as styles from "./GesturePanel.css";

/** null id = new gesture. */
type Drawing = { id: string | null; initial?: GesturePoint[] };

export const GesturePanel = () => {
  const { lang, i18n } = usePrefs();
  const { profile, mutateProfile, mappings } = useProfileCtx();
  const { setEditor } = useEditor();
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
        lang={lang}
        emptyLabel={i18n.ballScrollKey}
        clearLabel={i18n.clear}
        onOpenCapture={() =>
          setEditor({ kind: "ball_scroll_activator", slot, target: "gesture", rejected: null })
        }
        onClear={() =>
          mutateProfile((loaded) =>
            withGesturePatch(
              loaded,
              isToggle ? { toggleActivator: null } : { holdActivator: null },
            ),
          )
        }
      />
    );
  };

  const save = (points: GesturePoint[]) => {
    const target = drawing;
    setDrawing(null);
    if (target === null) {
      return;
    }
    mutateProfile((loaded) =>
      target.id === null
        ? withGestureAdded(loaded, {
            id: crypto.randomUUID(),
            template: points,
            click: { type: "default" },
            longPress: { type: "disabled" },
          })
        : withGestureTemplate(loaded, target.id, points),
    );
  };

  return (
    <Panel variant="plain">
      <Muted as="p" className={styles.description}>
        {i18n.gestureDesc}
      </Muted>
      <div className={styles.keys}>
        {keyRow("hold")}
        {keyRow("toggle")}
      </div>
      <div className={panelStyles.toolbar}>
        <Button className={panelStyles.addButton} onClick={() => setDrawing({ id: null })}>
          {i18n.customMappingAdd}
        </Button>
      </div>
      {gestures.entries.length === 0 ? (
        <Muted className={panelStyles.empty}>{i18n.gestureEmpty}</Muted>
      ) : (
        <ReorderableList
          items={gestures.entries}
          getKey={(entry) => entry.id}
          onReorder={(from, to) => mutateProfile((loaded) => withGestureMoved(loaded, from, to))}
          hint={i18n.reorderHint}
          className={styles.list}
          renderRow={(entry, _index, reorder) => (
            <GestureRow
              entry={entry}
              reorder={reorder}
              onRedraw={() => setDrawing({ id: entry.id, initial: entry.template })}
              onPick={(value) =>
                applyCatalogSelection(
                  { kind: "gesture", id: entry.id },
                  "click",
                  value,
                  profile,
                  setEditor,
                  mappings.updateSlot,
                )
              }
              onRemove={() => mutateProfile((loaded) => withGestureRemoved(loaded, entry.id))}
            />
          )}
        />
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
