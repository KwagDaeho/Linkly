type ToastListener = (message: string) => void;

let listener: ToastListener | null = null;

/** Subscribed by ToastProvider; safe to call from hooks outside the provider tree. */
export const publishToast = (message: string): void => {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }
  listener?.(trimmed);
};

export const subscribeToast = (next: ToastListener): (() => void) => {
  listener = next;
  return () => {
    if (listener === next) {
      listener = null;
    }
  };
};
