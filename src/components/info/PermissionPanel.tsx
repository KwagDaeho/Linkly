import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Row } from "@/components/ui/Row";
import { usePrefs } from "@/hooks/prefs";
import { useSession } from "@/hooks/session";

import * as styles from "./PermissionPanel.css";

export const PermissionPanel = () => {
  const { i18n } = usePrefs();
  const { grantAccess, permissionRestarting } = useSession();
  return (
    <Panel variant="plain">
      <ol className={styles.permSteps}>
        <li>{i18n.accessibilityStep1}</li>
        <li>{i18n.accessibilityStep2}</li>
        <li>{i18n.accessibilityStep3}</li>
      </ol>
      {permissionRestarting ? (
        <p className={styles.permRestarting}>{i18n.accessibilityRestarting}</p>
      ) : (
        <Row>
          <Button onClick={() => void grantAccess()}>{i18n.grantAccess}</Button>
        </Row>
      )}
    </Panel>
  );
};
