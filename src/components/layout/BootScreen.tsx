import { useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import * as tauri from "@/services/tauri";

import { AppBrandMark } from "./AppBrandTitle";
import * as probeStyles from "../info/ProbePanel.css";
import * as styles from "./BootScreen.css";

const BOOT_ACTIONS_DELAY_MS = 6_000;

export const BootScreen = () => {
  const { i18n } = usePrefs();
  const { bootError, lifecycle } = useProfileCtx();
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (bootError) {
      setShowActions(true);
      return;
    }
    const id = window.setTimeout(
      () => setShowActions(true),
      BOOT_ACTIONS_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [bootError]);

  return (
    <main className={styles.screen}>
      <div className={styles.stack}>
        <AppBrandMark className={styles.bootMark} />
        <p className={styles.loadingTag}>
          {bootError ? i18n.bootFailedTag : i18n.bootLoadingTag}
        </p>
        {bootError ? <pre className={probeStyles.probe}>{bootError}</pre> : null}
        {showActions ? (
          <div className={styles.actions}>
            <Button
              variant="default"
              size="default"
              onClick={() => void lifecycle.refresh()}
            >
              {i18n.bootRetry}
            </Button>
            <Button
              variant="ghost"
              size="tiny"
              onClick={() => void tauri.relaunchApp()}
            >
              {i18n.bootRelaunch}
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
};
