import type { CSSProperties } from "react";

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export type SegmentButtonPair = {
  listRect: DOMRect;
  startRect: DOMRect;
  endRect: DOMRect;
  span: number;
  trackTop: number;
  trackHeight: number;
};

export const readSegmentButtonPair = (
  list: HTMLElement,
  start: HTMLElement,
  end: HTMLElement,
): SegmentButtonPair | null => {
  const listRect = list.getBoundingClientRect();
  const startRect = start.getBoundingClientRect();
  const endRect = end.getBoundingClientRect();
  const span = endRect.left - startRect.left;
  if (span <= 1) {
    return null;
  }
  const cs = getComputedStyle(list);
  const padTop = parseFloat(cs.paddingTop);
  const padBottom = parseFloat(cs.paddingBottom);
  const trackHeight = list.clientHeight - padTop - padBottom;
  if (trackHeight <= 0) {
    return null;
  }
  return {
    listRect,
    startRect,
    endRect,
    span,
    trackTop: padTop,
    trackHeight,
  };
};

export const pillStyleForTabButton = (
  list: HTMLElement,
  button: HTMLElement,
): CSSProperties | null => {
  const listRect = list.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const cs = getComputedStyle(list);
  const padTop = parseFloat(cs.paddingTop);
  const padBottom = parseFloat(cs.paddingBottom);
  const trackHeight = list.clientHeight - padTop - padBottom;
  if (trackHeight <= 0) {
    return null;
  }
  return {
    left: buttonRect.left - listRect.left,
    top: padTop,
    width: buttonRect.width,
    height: trackHeight,
    opacity: 1,
  };
};

export const pillStyleForProgress = (
  pair: SegmentButtonPair,
  progress: number,
): CSSProperties => {
  const t = clamp(progress, 0, 1);
  const { listRect, startRect, endRect, trackTop, trackHeight } = pair;
  return {
    left:
      startRect.left - listRect.left + t * (endRect.left - startRect.left),
    top: trackTop,
    width: startRect.width + t * (endRect.width - startRect.width),
    height: trackHeight,
    opacity: 1,
  };
};

export const pillStyleForMultiProgress = (
  list: HTMLElement,
  buttons: HTMLElement[],
  progress: number,
): CSSProperties | null => {
  if (buttons.length === 0) {
    return null;
  }
  const maxIndex = buttons.length - 1;
  const t = clamp(progress, 0, maxIndex);
  const startIndex = Math.floor(t);
  const endIndex = Math.min(startIndex + 1, maxIndex);
  const start = buttons[startIndex];
  const end = buttons[endIndex];
  if (start === undefined || end === undefined) {
    return null;
  }
  if (startIndex === endIndex) {
    return pillStyleForTabButton(list, start);
  }
  const pair = readSegmentButtonPair(list, start, end);
  if (pair === null) {
    return null;
  }
  const local = startIndex === endIndex ? 0 : t - startIndex;
  return pillStyleForProgress(pair, local);
};
