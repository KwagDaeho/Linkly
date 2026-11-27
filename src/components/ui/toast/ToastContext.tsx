import { useEffect, useState, type ReactNode } from "react";

import { subscribeToast } from "@/services/toastBus";

import * as styles from "./Toast.css";

/** Renders toasts published via `publishToast` (services/toastBus). */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => subscribeToast((next) => setMessage(next)), []);

  useEffect(() => {
    if (message === null) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  return (
    <>
      {children}
      {message !== null ? (
        <div className={styles.host} role="status" aria-live="polite">
          <p className={styles.toast}>{message}</p>
        </div>
      ) : null}
    </>
  );
};
