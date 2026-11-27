import { useState } from "react";

import { buttonMappingDraftEditor } from "@/domain/editors";
import { newButtonMappingEntry } from "@/domain/profile";
import {
  DEVICE_TRIGGER_PROXY_LIMIT,
  deviceTriggerProxyCount,
} from "@/domain/profile/deviceTriggers";
import { findScopedActivatorConflict } from "@/domain/profile/triggerConflict";
import { scopedButtonMappingsOf } from "@/domain/profile/triggerScope";
import { useEditor } from "@/hooks/editor";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Button, Muted, Panel } from "@/components/ui";
import { publishToast } from "@/components/ui/toast/toastBus";
import type { Activator } from "@/types";
import { ButtonMappingRow } from "./ButtonMappingRow";
import { DeviceInfoModal, type DeviceInfoSummary } from "./DeviceInfoModal";
import { DeviceTriggerCapture } from "./DeviceTriggerCapture";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { buttonGrid, reorderRows } from "./ButtonMappingPanel.css";
import * as styles from "../custom/CustomButtonMappingPanel.css";

interface ButtonMappingPanelProps {
  /** Device scope: display name of the keyboard (triggers are captured on it). */
  deviceLabel?: string;
  /** Device scope: keyboard not connected — no capture possible. */
  deviceDisconnected?: boolean;
  /** Device scope: details for the device-info dialog. */
  device?: DeviceInfoSummary;
}

export const ButtonMappingPanel = (props: ButtonMappingPanelProps) => {
  const { i18n } = usePrefs();
  const { profile } = useProfileCtx();
  const { scope, buttonMappings } = useScopedTriggerApi();
  const { setEditor } = useEditor();
  /** Device-scope capture: null entryId = new row. */
  const [capture, setCapture] = useState<{ entryId: string | null } | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  if (profile === null) {
    return null;
  }
  const entries = scopedButtonMappingsOf(profile, scope);
  const isDevice = scope.kind === "device";

  const assignDeviceTrigger = (keyName: string) => {
    const entryId = capture?.entryId ?? null;
    setCapture(null);
    const activator: Activator = { type: "key", name: keyName };
    if (
      findScopedActivatorConflict(profile, scope, activator, {
        buttonMappingEntryId: entryId ?? undefined,
      })
    ) {
      publishToast(i18n.buttonMappingAlreadyRegistered);
      return;
    }
    if (entryId === null) {
      buttonMappings.add({ ...newButtonMappingEntry(), activator });
    } else {
      void buttonMappings.updateActivator(entryId, activator);
    }
  };

  return (
    <Panel variant="plain">
      {isDevice && props.device !== undefined ? (
        <div className={styles.toolbar}>
          <Button
            variant="ghost"
            className={styles.addButton}
            onClick={() => setInfoOpen(true)}
          >
            {i18n.deviceInfoButton}
          </Button>
        </div>
      ) : null}
      <div className={styles.toolbar}>
        <Button
          className={styles.addButton}
          disabled={isDevice && props.deviceDisconnected === true}
          onClick={() =>
            isDevice
              ? setCapture({ entryId: null })
              : setEditor(buttonMappingDraftEditor())
          }
        >
          {i18n.customMappingAdd}
        </Button>
      </div>
      {isDevice && deviceTriggerProxyCount(profile) > DEVICE_TRIGGER_PROXY_LIMIT ? (
        <Muted className={styles.empty}>{i18n.deviceTriggerProxyExhausted}</Muted>
      ) : null}
      {entries.length === 0 ? (
        <Muted className={styles.empty}>{i18n.buttonMappingEmpty}</Muted>
      ) : (
        <div className={buttonGrid}>
          <div className={styles.customMappingHead}>
            <span aria-hidden />
            <span>{i18n.buttonMappingInput}</span>
            <span>{i18n.mappingAction}</span>
            <span aria-hidden />
            <span>{i18n.autoClickEnable}</span>
            <span>{i18n.longPressEnable}</span>
            <span>{i18n.mappingActionLong}</span>
            <span aria-hidden />
          </div>
          <ReorderableList
            items={entries}
            getKey={(entry) => entry.id}
            onReorder={buttonMappings.move}
            hint={i18n.reorderHint}
            className={reorderRows}
            renderRow={(entry, _index, reorder) => (
              <ButtonMappingRow
                entry={entry}
                reorder={reorder}
                onCaptureTrigger={
                  isDevice
                    ? () => {
                        if (props.deviceDisconnected !== true) {
                          setCapture({ entryId: entry.id });
                        }
                      }
                    : undefined
                }
              />
            )}
          />
        </div>
      )}
      {infoOpen && props.device !== undefined ? (
        <DeviceInfoModal device={props.device} onClose={() => setInfoOpen(false)} />
      ) : null}
      {capture !== null && scope.kind === "device" ? (
        <DeviceTriggerCapture
          deviceKey={scope.deviceKey}
          deviceLabel={props.deviceLabel ?? scope.deviceKey}
          onCaptured={assignDeviceTrigger}
          onCancel={() => setCapture(null)}
        />
      ) : null}
    </Panel>
  );
};
