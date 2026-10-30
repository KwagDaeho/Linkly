import { openEventViewerWindow } from "@/services/eventViewerWindow";
import { usePrefs } from "@/hooks/prefs";
import { Button, Panel } from "@/components/ui";

import * as styles from "./EventViewerLauncher.css";

export const EventViewerLauncher = () => {
  const { i18n } = usePrefs();
  return (
    <Panel>
      <div className={styles.actions}>
        <Button onClick={() => void openEventViewerWindow("keyboard")}>
          {i18n.inputEventOpenKeyboard}
        </Button>
        <Button onClick={() => void openEventViewerWindow("mouse")}>
          {i18n.inputEventOpenMouse}
        </Button>
      </div>
    </Panel>
  );
};
