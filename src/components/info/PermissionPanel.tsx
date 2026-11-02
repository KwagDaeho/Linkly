import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Row } from "@/components/ui/Row";
import { usePrefs } from "@/hooks/prefs";
import { useSession } from "@/hooks/session";
import * as tauri from "@/services/tauri";

import * as styles from "./PermissionPanel.css";

const onOff = (on: boolean): string => (on ? "ON" : "OFF");

export const PermissionPanel = () => {
  const { i18n } = usePrefs();
  const {
    grantAccess,
    permissionRestarting,
    permissionStatus,
    openAccessibilitySettings,
  } = useSession();

  const axOn =
    permissionStatus !== null &&
    (permissionStatus.accessibility || permissionStatus.postEvent);
  const inputOn =
    permissionStatus !== null && permissionStatus.inputMonitoring;

  return (
    <Panel variant="plain">
      <ol className={styles.permSteps}>
        <li>{i18n.accessibilityStep1}</li>
        <li>{i18n.accessibilityStep2}</li>
        <li>{i18n.accessibilityStep3}</li>
        <li>{i18n.accessibilityStep4}</li>
      </ol>
      {permissionStatus !== null && (
        <ul className={styles.permStatus}>
          <li>
            {i18n.accessibility}: {onOff(axOn)}
          </li>
          <li>
            {i18n.inputMonitoring}: {onOff(inputOn)}
          </li>
        </ul>
      )}
      {permissionRestarting ? (
        <>
          <p className={styles.permRestarting}>{i18n.accessibilityRestarting}</p>
          <Row>
            <Button onClick={() => void tauri.relaunchApp()}>
              {i18n.accessibilityRestartRetry}
            </Button>
          </Row>
        </>
      ) : (
        <Row>
          <Button onClick={() => void grantAccess()}>{i18n.grantAccess}</Button>
          <Button variant="ghost" onClick={() => void openAccessibilitySettings()}>
            {i18n.openSettings}
          </Button>
        </Row>
      )}
    </Panel>
  );
};
