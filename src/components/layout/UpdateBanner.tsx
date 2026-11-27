import { Button } from "@/components/ui";
import { usePrefs } from "@/hooks";
import { useAppUpdate } from "@/hooks/useAppUpdate";

import * as styles from "./UpdateBanner.css";

export const UpdateBanner = () => {
  const { i18n } = usePrefs();
  const { state, install, skip } = useAppUpdate();
  if (state.phase === "idle") {
    return null;
  }
  const fill = (template: string) => template.replace("{version}", state.version);
  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>
        {state.phase === "available" && fill(i18n.updateAvailable)}
        {state.phase === "downloading" &&
          `${fill(i18n.updateDownloading)}${state.percent !== null ? ` ${state.percent}%` : ""}`}
        {state.phase === "error" && fill(i18n.updateFailed)}
      </span>
      {state.phase !== "downloading" && (
        <>
          <Button variant="ghost" className={styles.later} onClick={skip}>
            {i18n.updateSkip}
          </Button>
          <Button onClick={() => void install()}>
            {state.phase === "error" ? i18n.updateRetry : i18n.updateInstall}
          </Button>
        </>
      )}
    </div>
  );
};
