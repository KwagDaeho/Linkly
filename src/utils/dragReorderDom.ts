/** DOM measuring / scrolling for pointer drag-to-reorder lists. */

export const measureStride = (
  list: HTMLElement | null,
  index: number,
): number => {
  const item = list?.children.item(index);
  const next = list?.children.item(index + 1);
  if (item instanceof HTMLElement && next instanceof HTMLElement) {
    return next.offsetTop - item.offsetTop;
  }
  if (item instanceof HTMLElement) {
    const listStyles = window.getComputedStyle(list!);
    const gap = Number.parseFloat(listStyles.rowGap || listStyles.gap || "0") || 0;
    return item.offsetHeight + gap;
  }
  return 40;
};

export const pointerListY = (
  clientY: number,
  list: HTMLElement,
  viewport: HTMLElement | null,
): number => {
  const listRect = list.getBoundingClientRect();
  const scrollTop = viewport?.scrollTop ?? 0;
  return clientY - listRect.top + scrollTop;
};

export const autoScrollViewport = (
  viewport: HTMLElement | null,
  clientY: number,
) => {
  if (!viewport) {
    return;
  }
  const rect = viewport.getBoundingClientRect();
  const edge = 32;
  if (clientY < rect.top + edge) {
    viewport.scrollTop -= 6;
  } else if (clientY > rect.bottom - edge) {
    viewport.scrollTop += 6;
  }
};
