import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  findCatalogEntry,
  findCatalogSelectionForPickValue,
} from "@/domain/actions";
import { catalogEntryPickValue } from "@/domain/actions/catalogPickValue";
import { catalogValueForAction } from "@/domain/profile";
import {
  describeAction,
  entryLabel,
  groupCatalog,
  subcategoryLabel,
} from "@/i18n";
import { usePrefs } from "@/hooks";
import type {
  Action,
  ActionCategoryId,
  ActionLetterSubcategoryId,
  CatalogEntry,
} from "@/types";

import { OverlayScrollArea } from "@/components/layout/OverlayScrollArea";

import * as styles from "./ActionSelect.css";

interface ActionSelectProps {
  action: Action;
  onPick: (value: string) => void;
  disabled?: boolean;
}

const MENU_GAP_PX = 4;
/** Every depth column uses the same width; menu grows right when 3rd column appears. */
export const MENU_COL_WIDTH_PX = 168;
/** Dropdown height cap (columns scroll inside). */
const MENU_HEIGHT_CAP_PX = 280;
const MENU_MIN_USABLE_PX = 140;

interface MenuLayout {
  top: number;
  left: number;
  width: number;
  height: number;
  columnCount: 2 | 3;
}

const menuColumnCount = (hasSubcategories: boolean): 2 | 3 =>
  hasSubcategories ? 3 : 2;

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

const layoutMenu = (
  trigger: HTMLButtonElement,
  columnCount: 2 | 3,
  anchorLeft: number | null,
): MenuLayout => {
  const rect = trigger.getBoundingClientRect();
  const width = Math.max(rect.width, columnCount * MENU_COL_WIDTH_PX);
  const viewportPad = 8;
  const spaceBelow =
    window.innerHeight - rect.bottom - viewportPad - MENU_GAP_PX;
  const spaceAbove = rect.top - viewportPad - MENU_GAP_PX;
  const openBelow =
    spaceBelow >= MENU_MIN_USABLE_PX || spaceBelow >= spaceAbove;
  const available = openBelow ? spaceBelow : spaceAbove;
  const height = Math.min(
    MENU_HEIGHT_CAP_PX,
    Math.max(MENU_MIN_USABLE_PX, available),
  );
  const top = openBelow
    ? rect.bottom + MENU_GAP_PX
    : Math.max(viewportPad, rect.top - height - MENU_GAP_PX);
  let left = anchorLeft ?? rect.left;
  if (left + width > window.innerWidth - viewportPad) {
    left = Math.max(viewportPad, window.innerWidth - width - viewportPad);
  }
  if (left < viewportPad) {
    left = viewportPad;
  }
  return { top, left, width, height, columnCount };
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
  const menuAnchorLeftRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);
  const [activeCategory, setActiveCategory] = useState<ActionCategoryId>(() =>
    findCatalogSelectionForPickValue(value).category,
  );
  const [activeSubcategory, setActiveSubcategory] = useState<
    ActionLetterSubcategoryId | undefined
  >(() => findCatalogSelectionForPickValue(value).subcategory);

  const displayLabel =
    matched === undefined
      ? describeAction(props.action, lang)
      : entryDisplayLabel(matched, lang);

  const activeGroup =
    groups.find((group) => group.id === activeCategory) ?? groups[0];

  const hasSubcategories =
    activeGroup?.subcategories !== undefined &&
    activeGroup.subcategories.length > 0;

  const activeSubGroup =
    hasSubcategories && activeSubcategory !== undefined
      ? activeGroup?.subcategories?.find((sub) => sub.id === activeSubcategory)
      : hasSubcategories
        ? activeGroup?.subcategories?.[0]
        : undefined;

  const visibleEntries =
    activeSubGroup !== undefined
      ? activeSubGroup.entries
      : (activeGroup?.entries ?? []);

  const syncMenuLayout = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger === null) {
      return;
    }
    const columnCount = menuColumnCount(hasSubcategories);
    const next = layoutMenu(trigger, columnCount, menuAnchorLeftRef.current);
    if (menuAnchorLeftRef.current === null) {
      menuAnchorLeftRef.current = next.left;
    }
    setMenuLayout(next);
  }, [hasSubcategories]);

  useEffect(() => {
    if (!open) {
      setMenuLayout(null);
      menuAnchorLeftRef.current = null;
      return;
    }
    const selection = findCatalogSelectionForPickValue(value);
    setActiveCategory(selection.category);
    setActiveSubcategory(selection.subcategory);
  }, [open, value, lang]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    syncMenuLayout();
    const frame = requestAnimationFrame(() => syncMenuLayout());
    return () => cancelAnimationFrame(frame);
  }, [open, hasSubcategories, syncMenuLayout]);

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
            data-columns={hasSubcategories ? "3" : "2"}
            onWheel={(event) => {
              event.stopPropagation();
            }}
            style={{
              top: menuLayout.top,
              left: menuLayout.left,
              width: menuLayout.width,
              minWidth: menuLayout.width,
              maxWidth: menuLayout.width,
              height: menuLayout.height,
              maxHeight: menuLayout.height,
              gridTemplateColumns: `repeat(${menuLayout.columnCount}, ${MENU_COL_WIDTH_PX}px)`,
            }}
          >
            <div className={styles.categoryPane} role="presentation">
              <OverlayScrollArea
                className={styles.paneViewport}
                contentKey={`${lang}-${groups.length}-${menuLayout.height}`}
              >
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
                    onMouseEnter={() => {
                      setActiveCategory(group.id);
                      const firstSub = group.subcategories?.[0]?.id;
                      setActiveSubcategory(firstSub);
                    }}
                    onFocus={() => {
                      setActiveCategory(group.id);
                      const firstSub = group.subcategories?.[0]?.id;
                      setActiveSubcategory(firstSub);
                    }}
                    onClick={() => {
                      setActiveCategory(group.id);
                      const firstSub = group.subcategories?.[0]?.id;
                      setActiveSubcategory(firstSub);
                    }}
                  >
                    <span
                      className={`${styles.radio} ${isActive ? styles.radioOn : ""}`}
                      aria-hidden
                    />
                    <span className={styles.menuRowLabel}>{group.label}</span>
                    {(group.subcategories?.length ?? 0) > 0 ? (
                      <span className={styles.rowChevron} aria-hidden>
                        ›
                      </span>
                    ) : null}
                  </button>
                );
              })}
              </OverlayScrollArea>
            </div>
            {hasSubcategories && activeGroup.subcategories !== undefined ? (
              <div className={styles.subcategoryPane} role="presentation">
                <OverlayScrollArea
                  className={styles.paneViewport}
                  contentKey={`${activeCategory}-${lang}-${menuLayout.height}`}
                >
                {activeGroup.subcategories.map((sub) => {
                  const isActive = sub.id === activeSubGroup?.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      role="option"
                      data-action-select-item=""
                      aria-selected={isActive}
                      className={`${styles.categoryRow} ${isActive ? styles.categoryRowActive : ""}`}
                      onMouseEnter={() => setActiveSubcategory(sub.id)}
                      onFocus={() => setActiveSubcategory(sub.id)}
                      onClick={() => setActiveSubcategory(sub.id)}
                    >
                      <span
                        className={`${styles.radio} ${isActive ? styles.radioOn : ""}`}
                        aria-hidden
                      />
                      <span className={styles.menuRowLabel}>
                        {subcategoryLabel(sub.id, lang)}
                      </span>
                      <span className={styles.rowChevron} aria-hidden>
                        ›
                      </span>
                    </button>
                  );
                })}
                </OverlayScrollArea>
              </div>
            ) : null}
            <div
              className={
                hasSubcategories ? styles.entryPane : styles.entryPaneTwoCol
              }
              role="presentation"
            >
              <OverlayScrollArea
                className={styles.paneViewport}
                contentKey={`${activeCategory}-${activeSubGroup?.id ?? ""}-${visibleEntries.length}-${menuLayout.height}`}
              >
              {visibleEntries.map((entry) => {
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
              </OverlayScrollArea>
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
          setOpen((previous) => {
            const next = !previous;
            if (next && triggerRef.current !== null) {
              menuAnchorLeftRef.current = null;
              const group =
                groups.find((g) => g.id === activeCategory) ?? groups[0];
              const columnCount = menuColumnCount(
                (group?.subcategories?.length ?? 0) > 0,
              );
              const layout = layoutMenu(
                triggerRef.current,
                columnCount,
                null,
              );
              menuAnchorLeftRef.current = layout.left;
              setMenuLayout(layout);
            }
            if (!next) {
              setMenuLayout(null);
              menuAnchorLeftRef.current = null;
            }
            return next;
          });
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
