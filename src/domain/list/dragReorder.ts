/** Pure helpers for pointer drag-to-reorder lists (macro steps, trigger rows). */

export type DragState = {
  fromIndex: number;
  overIndex: number;
  pointerId: number;
  offsetY: number;
  startClientY: number;
  stride: number;
  lastSwapClientY: number;
};

const SWAP_COOLDOWN_PX = 18;

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (from === to) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
};

const desiredOverIndex = (
  y: number,
  count: number,
  stride: number,
): number => {
  const raw = Math.floor((y + stride * 0.5) / stride);
  return Math.max(0, Math.min(count - 1, raw));
};

export const updateOverIndex = (
  y: number,
  overIndex: number,
  stride: number,
  count: number,
  clientY: number,
  lastSwapClientY: number,
): { overIndex: number; lastSwapClientY: number } => {
  if (count <= 1 || stride <= 0) {
    return { overIndex: 0, lastSwapClientY };
  }

  const desired = desiredOverIndex(y, count, stride);
  if (desired === overIndex) {
    return { overIndex, lastSwapClientY };
  }

  if (Math.abs(clientY - lastSwapClientY) < SWAP_COOLDOWN_PX) {
    return { overIndex, lastSwapClientY };
  }

  const next = overIndex + (desired > overIndex ? 1 : -1);
  return { overIndex: next, lastSwapClientY: clientY };
};

export const itemShiftY = (index: number, drag: DragState): number => {
  const { fromIndex, overIndex, stride } = drag;
  if (index === fromIndex) {
    return 0;
  }
  if (fromIndex < overIndex && index > fromIndex && index <= overIndex) {
    return -stride;
  }
  if (fromIndex > overIndex && index >= overIndex && index < fromIndex) {
    return stride;
  }
  return 0;
};

/** `ids` sorted by a saved order; ids not in it keep their relative order at the end. */
export const applySavedOrder = (ids: string[], order: readonly string[]): string[] => {
  const rank = new Map(order.map((id, index) => [id, index]));
  return ids
    .map((id, index) => ({ id, index }))
    .sort(
      (a, b) =>
        (rank.get(a.id) ?? order.length + a.index) - (rank.get(b.id) ?? order.length + b.index),
    )
    .map((entry) => entry.id);
};
