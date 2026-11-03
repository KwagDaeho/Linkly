import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { findCatalogEntry } from "@/domain/actions";
import { catalogEntryPickValue } from "@/domain/actions/catalogPickValue";
import { catalogValueForAction } from "@/domain/profile";
import { describeAction, entryLabel, groupCatalog } from "@/i18n";
import { usePrefs } from "@/hooks";
import type { Action, ActionCategoryId, CatalogEntry } from "@/types";

import * as styles from "./ActionSelect.css";

interface ActionSelectProps {
  action: Action;
  onPick: (value: string) => void;
  disabled?: boolean;
}

const MENU_ESTIMATE_PX = 320;
const MENU_GAP_PX = 4;

interface MenuLayout {
  top: number;
  left: number;
  minWidth: number;
  maxHeight: number;
}

const entryDisplayLabel = (entry: CatalogEntry, lang: "ko" | "en"): string => {
  if (entry.special === "custom_key") {
    return entryLabel("custom_key", lang);
  }
  if (entry.special === "macro") {
    return entryLabel("macro", lang);
  }
  if (entry.special === "open_app") {
    return entryLabel("open_app_pick", lang);
  }
  return entryLabel(entry.id, lang);
};

const findCategoryForValue = (
  groups: ReturnType<typeof groupCatalog>,
  value: string,
): ActionCategoryId => {
  for (const group of groups) {
    for (const entry of group.entries) {
      if (catalogEntryPickValue(entry) === value) {
        return group.id;
      }
    }
  }
  return groups[0]?.id ?? "basic";
};

const layoutMenu = (trigger: HTMLButtonElement): MenuLayout => {
  const rect = trigger.getBoundingClientRect();
  const minWidth = Math.max(rect.width, 352);
  const viewportPad = 8;
  let top = rect.bottom + MENU_GAP_PX;
  let maxHeight = Math.min(
    MENU_ESTIMATE_PX,
    window.innerHeight - top - viewportPad,
  );
  if (maxHeight < 160) {
    top = Math.max(viewportPad, rect.top - MENU_ESTIMATE_PX - MENU_GAP_PX);
    maxHeight = Math.min(MENU_ESTIMATE_PX, rect.top - viewportPad - MENU_GAP_PX);
  }
  const left = Math.min(
    rect.left,
    Math.max(viewportPad, window.innerWidth - minWidth - viewportPad),
  );
  return { top, left, minWidth, maxHeight };
};

export const ActionSelect = (props: ActionSelectProps) => {
  const { lang } = usePrefs();
  const groups = groupCatalog(lang);
  const matched = findCatalogEntry(props.action);
  const value = catalogValueForAction(props.action);
  const disabled = props.disabled === true;
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);
  const [activeCategory, setActiveCategory] = useState<ActionCategoryId>(() =>
    findCategoryForValue(groups, value),
  );

  const displayLabel =
    matched === undefined
      ? describeAction(props.action, lang)
      : entryDisplayLabel(matched, lang);

  const activeGroup =
    groups.find((group) => group.id === activeCategory) ?? groups[0];

  const syncMenuLayout = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger === null) {
      return;
    }
    setMenuLayout(layoutMenu(trigger));
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuLayout(null);
      return;
    }
    setActiveCategory(findCategoryForValue(groups, value));
    syncMenuLayout();
  }, [open, value, lang, syncMenuLayout]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onLayout = () => syncMenuLayout();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open, syncMenuLayout]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const pick = (next: string) => {
    if (disabled) {
      return;
    }
    props.onPick(next);
    setOpen(false);
  };

  const menu =
    open && menuLayout !== null && activeGroup !== undefined
      ? createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            id={listId}
            role="listbox"
            data-action-select-menu=""
            style={{
              top: menuLayout.top,
              left: menuLayout.left,
              minWidth: menuLayout.minWidth,
              maxHeight: menuLayout.maxHeight,
            }}
          >
            <div className={styles.categoryPane} role="presentation">
              {groups.map((group) => {
                const isActive = group.id === activeCategory;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="option"
                    data-action-select-item=""
                    aria-selected={isActive}
                    className={`${styles.categoryRow} ${isActive ? styles.categoryRowActive : ""}`}
                    onMouseEnter={() => setActiveCategory(group.id)}
                    onFocus={() => setActiveCategory(group.id)}
                    onClick={() => setActiveCategory(group.id)}
                  >
                    <span
                      className={`${styles.radio} ${isActive ? styles.radioOn : ""}`}
                      aria-hidden
                    />
                    <span className={styles.menuRowLabel}>{group.label}</span>
                    <span className={styles.rowChevron} aria-hidden>
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.entryPane} role="presentation">
              {activeGroup.entries.map((entry) => {
                const pickValue = catalogEntryPickValue(entry);
                const selected = pickValue === value;
                const label = entryDisplayLabel(entry, lang);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    role="option"
                    data-action-select-item=""
                    aria-selected={selected}
                    className={`${styles.entryRow} ${selected ? styles.entryRowSelected : ""}`}
                    onClick={() => pick(pickValue)}
                  >
                    <span
                      className={`${styles.radio} ${selected ? styles.radioOn : ""}`}
                      aria-hidden
                    />
                    <span className={styles.menuRowLabel}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-action-select=""
      data-disabled={disabled ? "true" : "false"}
      data-open={open ? "true" : "false"}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        data-action-select-trigger=""
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (disabled) {
            return;
          }
          setOpen((previous) => !previous);
        }}
      >
        <span className={styles.triggerLabel}>{displayLabel}</span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>
      {menu}
    </div>
  );
};
