import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cx } from "@/utils/cx";

import { shell } from "./AppShell.css";
import * as styles from "./OverlayScrollbar.css";

type Thumb = {
  top: number;
  height: number;
};
/** Fully hidden this long after the last scroll (unchanged). */
const SCROLLBAR_GONE_MS = 1120;
/** Start opacity fade sooner than before (was 900ms). */
const SCROLLBAR_FADE_START_MS = 480;
const SCROLLBAR_FADE_MS = SCROLLBAR_GONE_MS - SCROLLBAR_FADE_START_MS;
interface OverlayScrollbarProps {
  /** Re-sync thumb when main content changes (e.g. tab switch); does not reset scroll. */
  contentKey?: string;
  /** When set, syncs to this element instead of `#root` (e.g. active tab panel). */
  scrollRef?: RefObject<HTMLElement | null>;
}
export const OverlayScrollbar = (props: OverlayScrollbarProps) => {
  const dragRef = useRef<{
    startY: number;
    startScroll: number;
  } | null>(null);
  const syncRef = useRef<() => void>(() => {});
  const hideTimerRef = useRef<number | null>(null);
  const [overflow, setOverflow] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [thumb, setThumb] = useState<Thumb>({ top: 0, height: 40 });
  const [trackBox, setTrackBox] = useState<{ top: number; height: number } | null>(
    null,
  );
  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setRevealed(false);
      hideTimerRef.current = null;
    }, SCROLLBAR_FADE_START_MS);
  };
  const reveal = () => {
    setRevealed(true);
    scheduleHide();
  };
  useEffect(() => {
    let scrollEl =
      props.scrollRef?.current ??
      (props.scrollRef ? null : document.getElementById("root"));
    if (!scrollEl) {
      const retry = window.requestAnimationFrame(() => syncRef.current());
      return () => window.cancelAnimationFrame(retry);
    }
    const sync = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (props.scrollRef?.current) {
        const rect = props.scrollRef.current.getBoundingClientRect();
        setTrackBox({ top: rect.top, height: rect.height });
      } else {
        setTrackBox(null);
      }
      const hasOverflow = scrollHeight > clientHeight + 1;
      setOverflow(hasOverflow);
      if (!hasOverflow) {
        setRevealed(false);
        clearHideTimer();
        return;
      }
      const ratio = clientHeight / scrollHeight;
      const height = Math.max(36, Math.round(clientHeight * ratio));
      const maxTop = Math.max(0, clientHeight - height);
      const range = scrollHeight - clientHeight;
      const top = range <= 0 ? 0 : Math.round((scrollTop / range) * maxTop);
      setThumb({ top, height });
    };
    syncRef.current = sync;
    const onScroll = () => {
      reveal();
      sync();
    };
    sync();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sync);
    const ro = new ResizeObserver(sync);
    ro.observe(scrollEl);
    for (const child of scrollEl.children) {
      ro.observe(child);
    }
    const root = document.getElementById("root");
    const shellEl = root?.querySelector(`main.${shell}`);
    if (shellEl) ro.observe(shellEl);
    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sync);
      ro.disconnect();
      clearHideTimer();
    };
  }, [props.contentKey, props.scrollRef]);
  useEffect(() => {
    setRevealed(false);
    clearHideTimer();
    requestAnimationFrame(() => syncRef.current());
    const retry = window.setTimeout(() => syncRef.current(), 0);
    return () => window.clearTimeout(retry);
  }, [props.contentKey, props.scrollRef]);
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const scrollEl =
        props.scrollRef?.current ?? document.getElementById("root");
      if (!drag || !scrollEl) return;
      reveal();
      const range = scrollEl.scrollHeight - scrollEl.clientHeight;
      const maxTop = Math.max(0, scrollEl.clientHeight - thumb.height);
      if (range <= 0 || maxTop <= 0) return;
      const delta = event.clientY - drag.startY;
      const next = drag.startScroll + (delta / maxTop) * range;
      scrollEl.scrollTop = Math.min(range, Math.max(0, next));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [props.scrollRef, thumb.height]);
  if (!overflow) return null;

  const getScrollEl = () =>
    props.scrollRef?.current ?? document.getElementById("root");
  const shown = revealed || hovering;
  const trackStyle: CSSProperties | undefined = trackBox
    ? { top: trackBox.top, height: trackBox.height, bottom: "auto" }
    : undefined;
  return createPortal(
    <div
      className={cx(styles.root, shown && styles.visible)}
      style={
        {
          "--overlay-scrollbar-fade-out": `${SCROLLBAR_FADE_MS}ms`,
          ...trackStyle,
        } as CSSProperties
      }
      aria-hidden
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onPointerDown={(event) => {
        reveal();
        const scrollEl = getScrollEl();
        if (!scrollEl || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const range = scrollEl.scrollHeight - scrollEl.clientHeight;
        const maxTop = Math.max(0, scrollEl.clientHeight - thumb.height);
        if (range <= 0 || maxTop <= 0) return;
        const top = Math.min(maxTop, Math.max(0, y - thumb.height / 2));
        scrollEl.scrollTop = (top / maxTop) * range;
      }}
    >
      <div
        className={styles.thumb}
        style={{ top: thumb.top, height: thumb.height }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          reveal();
          const scrollEl = getScrollEl();
          if (!scrollEl) return;
          dragRef.current = {
            startY: event.clientY,
            startScroll: scrollEl.scrollTop,
          };
          const target = event.target;
          if (
            target instanceof HTMLElement &&
            typeof target.setPointerCapture === "function"
          ) {
            target.setPointerCapture(event.pointerId);
          }
        }}
      />
    </div>,
    document.body,
  );
};
