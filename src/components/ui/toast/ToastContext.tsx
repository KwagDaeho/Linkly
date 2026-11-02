import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as styles from "./Toast.css";
import { publishToast, subscribeToast } from "./toastBus";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);

  const showToast = useCallback((next: string) => {
    publishToast(next);
  }, []);

  useEffect(() => subscribeToast((next) => setMessage(next)), []);

  useEffect(() => {
    if (message === null) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message !== null ? (
        <div className={styles.host} role="status" aria-live="polite">
          <p className={styles.toast}>{message}</p>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
};
