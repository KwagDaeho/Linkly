import { check, type Update } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";

import { UPDATE_SKIPPED_KEY } from "@/constants/storage";
import { relaunchApp } from "@/services/tauri";

const FIRST_CHECK_DELAY_MS = 5_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const skippedVersion = (): string | null => {
  try {
    return localStorage.getItem(UPDATE_SKIPPED_KEY);
  } catch {
    return null;
  }
};

type AppUpdateState =
  | { phase: "idle" }
  | { phase: "available"; version: string }
  | { phase: "downloading"; version: string; percent: number | null }
  | { phase: "error"; version: string };

/** GitHub-release updates: check on launch and every few hours; install + relaunch. */
export const useAppUpdate = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [state, setState] = useState<AppUpdateState>({ phase: "idle" });

  useEffect(() => {
    if (import.meta.env.DEV) {
      return;
    }
    let alive = true;
    const run = () =>
      void check()
        .then((found) => {
          // "Skip" hides only that version; a newer release shows again.
          if (alive && found !== null && found.version !== skippedVersion()) {
            setUpdate(found);
            setState((prev) =>
              prev.phase === "downloading" ? prev : { phase: "available", version: found.version },
            );
          }
        })
        .catch((err) => console.warn("update check failed", err));
    const first = window.setTimeout(run, FIRST_CHECK_DELAY_MS);
    const every = window.setInterval(run, CHECK_INTERVAL_MS);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, []);

  const install = useCallback(async () => {
    if (update === null) {
      return;
    }
    const version = update.version;
    let total = 0;
    let received = 0;
    setState({ phase: "downloading", version, percent: null });
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          received += event.data.chunkLength;
          setState({
            phase: "downloading",
            version,
            percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : null,
          });
        }
      });
      await relaunchApp();
    } catch (err) {
      console.warn("update install failed", err);
      setState({ phase: "error", version });
    }
  }, [update]);

  const skip = useCallback(() => {
    if (update !== null) {
      try {
        localStorage.setItem(UPDATE_SKIPPED_KEY, update.version);
      } catch {
        // Still hide it for this session.
      }
    }
    setUpdate(null);
    setState({ phase: "idle" });
  }, [update]);

  return { state, install, skip };
};
