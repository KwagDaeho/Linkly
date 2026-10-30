import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";

import { AppBrandMark } from "./AppBrandTitle";
import * as probeStyles from "../info/ProbePanel.css";
import * as styles from "./BootScreen.css";

export const BootScreen = () => {
  const { i18n } = usePrefs();
  const { bootError } = useProfileCtx();
  return (
    <main className={styles.screen}>
      <div className={styles.stack}>
        <p className={styles.loadingTag}>
          {bootError ? i18n.bootFailedTag : i18n.bootLoadingTag}
        </p>
        <AppBrandMark />
        {bootError ? <pre className={probeStyles.probe}>{bootError}</pre> : null}
      </div>
    </main>
  );
};
