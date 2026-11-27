import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import { listReorderTransition } from "@/constants/motion";
import { moveItem } from "@/domain/list/dragReorder";

interface UseTabReorderOptions {
  ids: string[];
  /** Ids that stay in place (e.g. "Common" first). */
  lockedIds: readonly string[];
  listRef: RefObject<HTMLElement | null>;
  onCommit: (ids: string[]) => void;
}

type Grab = { id: string; pointerId: number; offsetX: number; offsetY: number };

const tabElement = (list: HTMLElement | null, id: string): HTMLElement | null =>
  list?.querySelector<HTMLElement>(`button[role='tab'][data-tab-id="${CSS.escape(id)}"]`) ?? null;

/**
 * Edit mode for a tab row, with the same feel as row reordering: the grabbed tab
 * follows the pointer, the others slide aside (FLIP) as it passes their centers, and
 * the hovered / dragged tab is outlined. ✓ commits the draft order, ✕ drops it.
 */
export const useTabReorder = ({ ids, lockedIds, listRef, onCommit }: UseTabReorderOptions) => {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const draftRef = useRef<string[] | null>(null);
  const grabRef = useRef<Grab | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  draftRef.current = draft;

  // Tabs appearing or disappearing while editing: keep the draft in step.
  useEffect(() => {
    setDraft((current) =>
      current === null
        ? null
        : [...current.filter((id) => ids.includes(id)), ...ids.filter((id) => !current.includes(id))],
    );
  }, [ids.join("|")]);

  /** Keep the grabbed tab under the pointer, wherever its slot now is. */
  const followPointer = () => {
    const grab = grabRef.current;
    const pointer = pointerRef.current;
    const list = listRef.current;
    const el = grab === null ? null : tabElement(list, grab.id);
    if (grab === null || pointer === null || list === null || el === null) {
      return;
    }
    const listRect = list.getBoundingClientRect();
    const dx = pointer.x - listRect.left - list.clientLeft - grab.offsetX - el.offsetLeft;
    const dy = pointer.y - listRect.top - list.clientTop - grab.offsetY - el.offsetTop;
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  // After a live reorder the grabbed tab's slot moved: re-anchor it to the pointer.
  useLayoutEffect(followPointer, [draft]);

  const endEdit = () => {
    setDraft(null);
    setDraggingId(null);
    setHoverId(null);
  };
  const start = () => setDraft(ids);
  const confirm = () => {
    if (draft !== null) {
      onCommit(draft);
    }
    endEdit();
  };

  const onPointerDown = (id: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (draft === null || lockedIds.includes(id) || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    grabRef.current = {
      id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    pointerRef.current = { x: event.clientX, y: event.clientY };
    setDraggingId(id);
    // Window listeners, not pointer capture: the tab's DOM node moves on each reorder.
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const onPointerMove = (event: PointerEvent) => {
    const grab = grabRef.current;
    const current = draftRef.current;
    const list = listRef.current;
    if (grab === null || event.pointerId !== grab.pointerId || current === null || list === null) {
      return;
    }
    pointerRef.current = { x: event.clientX, y: event.clientY };
    // Slot = locked tabs + movable tabs whose center the dragged tab's center passed.
    const center = {
      x: event.clientX - grab.offsetX + (tabElement(list, grab.id)?.offsetWidth ?? 0) / 2,
      y: event.clientY,
    };
    let slot = lockedIds.filter((id) => current.includes(id)).length;
    for (const tab of list.querySelectorAll<HTMLElement>("button[role='tab']")) {
      const id = tab.dataset.tabId;
      if (id === undefined || id === grab.id || lockedIds.includes(id)) {
        continue;
      }
      const rect = tab.getBoundingClientRect();
      const sameRow = center.y >= rect.top && center.y <= rect.bottom;
      if (sameRow ? center.x > rect.left + rect.width / 2 : center.y > rect.bottom) {
        slot += 1;
      }
    }
    const from = current.indexOf(grab.id);
    if (from >= 0 && slot !== from) {
      setDraft(moveItem(current, from, slot));
    } else {
      followPointer();
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    const grab = grabRef.current;
    if (grab === null || event.pointerId !== grab.pointerId) {
      return;
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    // Settle into the slot.
    const el = tabElement(listRef.current, grab.id);
    if (el !== null) {
      el.style.transition = listReorderTransition;
      el.style.transform = "";
    }
    grabRef.current = null;
    pointerRef.current = null;
    setDraggingId(null);
    setHoverId(grab.id);
  };

  return {
    editing: draft !== null,
    order: draft ?? ids,
    draggingId,
    /** Outlined tab: the one being dragged, else the hovered movable one. */
    highlightedId: draggingId ?? hoverId,
    start,
    confirm,
    cancel: endEdit,
    tabHandlers: (id: string) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => onPointerDown(id, event),
      onPointerEnter: () => {
        if (grabRef.current === null && !lockedIds.includes(id)) {
          setHoverId(id);
        }
      },
      onPointerLeave: () => {
        if (grabRef.current === null) {
          setHoverId((current) => (current === id ? null : current));
        }
      },
    }),
  };
};
