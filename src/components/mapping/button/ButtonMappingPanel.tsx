import { useState } from "react";

import { buttonMappingDraftEditor } from "@/domain/editors";
import {
  DEVICE_TRIGGER_PROXY_LIMIT,
  deviceTriggerProxyCount,
} from "@/domain/profile/deviceTriggers";
import { scopedButtonMappingsOf } from "@/domain/profile/triggerScope";
import { useEditor } from "@/hooks/editor";
import { useScopedTriggerApi } from "@/hooks/trigger/TriggerScopeContext";
import { usePrefs, useProfileCtx } from "@/hooks";
import { Button, Muted, Panel } from "@/components/ui";
import type { DeviceInfoSummary } from "@/types";
import { ButtonMappingRow } from "./ButtonMappingRow";
import { DeviceInfoModal } from "./DeviceInfoModal";
import { DeviceTriggerCapture } from "./DeviceTriggerCapture";
import { ReorderableList } from "@/components/ui/ReorderableList";
import { MappingTableHead } from "../MappingTableHead";
import * as styles from "../mappingPanel.css";

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
    buttonMappings.assignKeyTrigger(entryId, keyName);
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
        <div className={styles.table}>
          <MappingTableHead inputLabel={i18n.buttonMappingInput} />
          <ReorderableList
            items={entries}
            getKey={(entry) => entry.id}
            onReorder={buttonMappings.move}
            hint={i18n.reorderHint}
            className={styles.tableRows}
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
