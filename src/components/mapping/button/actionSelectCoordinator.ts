/** One open ActionSelect at a time; also used to close peers before opening. */

type CloseFn = () => void;

const instances = new Map<string, CloseFn>();

export const registerActionSelectInstance = (
  id: string,
  close: CloseFn,
): (() => void) => {
  instances.set(id, close);
  return () => {
    instances.delete(id);
  };
};

export const closeOtherActionSelects = (exceptId: string): void => {
  for (const [id, close] of instances) {
    if (id !== exceptId) {
      close();
    }
  }
};

export const closeAllActionSelects = (): void => {
  for (const close of instances.values()) {
    close();
  }
};
