import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Row } from "@/components/ui/Row";
import { usePrefs } from "@/hooks/prefs";
import { useSession } from "@/hooks/session";
import * as tauri from "@/services/tauri";
import type { PermissionKind } from "@/types";
import { cx } from "@/utils/cx";

import * as styles from "./PermissionPanel.css";

export const PermissionPanel = () => {
  const { i18n } = usePrefs();
  const { requestPermission, permissionRestarting, permissionStatus } = useSession();

  const rows: { kind: PermissionKind; label: string; on: boolean }[] = [
    {
      kind: "accessibility",
      label: i18n.accessibility,
      on:
        permissionStatus !== null &&
        (permissionStatus.accessibility || permissionStatus.postEvent),
    },
    {
      kind: "input_monitoring",
      label: i18n.inputMonitoring,
      on: permissionStatus !== null && permissionStatus.inputMonitoring,
    },
  ];

  return (
    <Panel variant="plain">
      <ol className={styles.permSteps}>
        <li>{i18n.accessibilityStep1}</li>
        <li>{i18n.accessibilityStep2}</li>
        <li>{i18n.accessibilityStep3}</li>
        <li>{i18n.accessibilityStep4}</li>
      </ol>
      {permissionRestarting ? (
        <>
          <p className={styles.permRestarting}>{i18n.accessibilityRestarting}</p>
          <Row>
            <Button onClick={() => void tauri.relaunchApp()}>{i18n.accessibilityRestartRetry}</Button>
          </Row>
        </>
      ) : (
        <ul className={styles.permRows}>
          {rows.map((row) => (
            <li key={row.kind} className={styles.permRow}>
              <span className={styles.permName}>{row.label}</span>
              <span className={cx(styles.permState, row.on && styles.permStateOn)}>
                {row.on ? i18n.permissionOn : i18n.permissionOff}
              </span>
              <span className={styles.permActions}>
                {row.on ? null : (
                  <Button size="tiny" onClick={() => void requestPermission(row.kind)}>
                    {i18n.permissionAllow}
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
