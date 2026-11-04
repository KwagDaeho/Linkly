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
import {
  closeOtherActionSelects,
  registerActionSelectInstance,
} from "./actionSelectCoordinator";
import {
  firstColumnContentHeightPx,
  layoutActionSelectMenu,
  menuColumnCount,
  MENU_COL_WIDTH_PX,
  resolveOneDepHeightPx,
  type MenuLayout,
} from "./actionSelectMenuLayout";

export { MENU_COL_WIDTH_PX };

interface ActionSelectProps {
  action: Action;
  onPick: (value: string) => void;
  disabled?: boolean;
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

export const ActionSelect = (props: ActionSelectProps) => {
  const { lang } = usePrefs();
  const groups = groupCatalog(lang);
  const matched = findCatalogEntry(props.action);
  const value = catalogValueForAction(props.action);
  const disabled = props.disabled === true;
  const listId = useId();
  const instanceId = useId();
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

  const closeMenu = useCallback(() => {
    setOpen(false);
    setMenuLayout(null);
    menuAnchorLeftRef.current = null;
  }, []);

  useEffect(() => {
    return registerActionSelectInstance(instanceId, closeMenu);
  }, [instanceId, closeMenu]);

  const openMenu = useCallback(() => {
    closeOtherActionSelects(instanceId);
    setOpen(true);
  }, [instanceId]);
  const displayLabel =
    matched === undefined
      ? describeAction(props.action, lang)
      : entryDisplayLabel(matched, lang);

  const activeGroup =
    groups.find((group) => group.id === activeCategory) ?? groups[0];

  const hasSubcategories =
    activeGroup?.subcategories !== undefined &&
    activeGroup.subcategories.length > 0;

  const letterSubcategorySelected =
    hasSubcategories && activeSubcategory !== undefined;

  const showEntryPane = !hasSubcategories || letterSubcategorySelected;

  const activeSubGroup =
    letterSubcategorySelected && activeGroup?.subcategories !== undefined
      ? activeGroup.subcategories.find((sub) => sub.id === activeSubcategory)
      : undefined;

  const visibleEntries =
    activeSubGroup !== undefined
      ? activeSubGroup.entries
      : hasSubcategories
        ? []
        : (activeGroup?.entries ?? []);

  const syncMenuLayout = useCallback(() => {
    const trigger = triggerRef.current;
    if (trigger === null) {
      return;
    }
    const columnCount = menuColumnCount(
      hasSubcategories,
      letterSubcategorySelected,
    );
    const oneDepHeight = resolveOneDepHeightPx(menuRef.current, groups.length);
    const next = layoutActionSelectMenu(
      trigger,
      columnCount,
      menuAnchorLeftRef.current,
      oneDepHeight,
    );
    if (menuAnchorLeftRef.current === null) {
      menuAnchorLeftRef.current = next.left;
    }
    setMenuLayout(next);
  }, [groups.length, hasSubcategories, letterSubcategorySelected]);

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
  }, [open, hasSubcategories, letterSubcategorySelected, syncMenuLayout]);

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
    const isInsideThisSelect = (target: Node): boolean => {
      if (rootRef.current?.contains(target)) {
        return true;
      }
      if (menuRef.current?.contains(target)) {
        return true;
      }
      return false;
    };
    const dismissIfOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (isInsideThisSelect(target)) {
        return;
      }
      closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };
    window.addEventListener("pointerdown", dismissIfOutside, true);
    window.addEventListener("mousedown", dismissIfOutside, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", dismissIfOutside, true);
      window.removeEventListener("mousedown", dismissIfOutside, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  const pick = (next: string) => {
    if (disabled) {
      return;
    }
    props.onPick(next);
    closeMenu();
  };

  const focusCategory = (group: (typeof groups)[number]) => {
    setActiveCategory(group.id);
    setActiveSubcategory(undefined);
  };

  const menuColumnCountCurrent = menuColumnCount(
    hasSubcategories,
    letterSubcategorySelected,
  );

  const menu =
    open && menuLayout !== null && activeGroup !== undefined
      ? createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            id={listId}
            role="listbox"
            data-action-select-menu=""
            data-columns={String(menuColumnCountCurrent)}
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
                persistentScrollbar
              >
              <div data-action-select-category-list="">
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
                    onMouseEnter={() => focusCategory(group)}
                    onFocus={() => focusCategory(group)}
                    onClick={() => focusCategory(group)}
                  >
                    <span className={styles.menuRowLabel}>{group.label}</span>
                    <span className={styles.rowChevron} aria-hidden>
                      ›
                    </span>
                  </button>
                );
              })}
              </div>
              </OverlayScrollArea>
            </div>
            {hasSubcategories && activeGroup.subcategories !== undefined ? (
              <div className={styles.subcategoryPane} role="presentation">
                <OverlayScrollArea
                  className={styles.paneViewport}
                  contentKey={`${activeCategory}-${lang}-${menuLayout.height}`}
                  persistentScrollbar
                >
                {activeGroup.subcategories.map((sub) => {
                  const isActive = sub.id === activeSubcategory;
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
            {showEntryPane ? (
            <div
              className={
                hasSubcategories ? styles.entryPane : styles.entryPaneTwoCol
              }
              role="presentation"
            >
              <OverlayScrollArea
                className={styles.paneViewport}
                contentKey={`${activeCategory}-${activeSubcategory ?? ""}-${visibleEntries.length}-${menuLayout.height}`}
                persistentScrollbar
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
                    <span className={styles.menuRowLabel}>{label}</span>
                    {selected ? (
                      <span
                        className={`${styles.selectionMark} ${styles.selectionMarkOn}`}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
              </OverlayScrollArea>
            </div>
            ) : null}
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
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) {
            return;
          }
          closeOtherActionSelects(instanceId);
        }}
        onClick={() => {
          if (disabled) {
            return;
          }
          if (open) {
            closeMenu();
            return;
          }
          openMenu();
          if (triggerRef.current !== null) {
            menuAnchorLeftRef.current = null;
            const group =
              groups.find((g) => g.id === activeCategory) ?? groups[0];
            const hasSubs = (group?.subcategories?.length ?? 0) > 0;
            const subSelected = hasSubs && activeSubcategory !== undefined;
            const columnCount = menuColumnCount(hasSubs, subSelected);
            const layout = layoutActionSelectMenu(
              triggerRef.current,
              columnCount,
              null,
              firstColumnContentHeightPx(groups.length),
            );
            menuAnchorLeftRef.current = layout.left;
            setMenuLayout(layout);
          }
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
