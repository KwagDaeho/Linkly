import { createContext, useContext, useState } from "react";
import { ACTIVATOR_REJECT_DUPLICATE } from "@/domain/editors/activatorCapture";
import {
  DuplicateActivatorError,
  findScopedActivatorConflict,
} from "@/domain/profile/triggerConflict";
import { useKeyCapture } from "@/hooks/capture/useKeyCapture";
import { usePrefs } from "@/hooks/prefs";
import { useProfileCtx } from "@/hooks/profile";
import { useTriggerScope } from "@/hooks/trigger/TriggerScopeContext";
import { useTriggerScopeMutations } from "@/hooks/trigger/useTriggerScopeMutations";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import { publishToast } from "@/components/ui/toast/toastBus";
import type {
  ActionSlot,
  ButtonId,
  ButtonMappingEntry,
  EditorContextValue,
  EditorMode,
} from "@/types";

export const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditor = (): EditorContextValue => {
  const context = useContext(EditorContext);
  if (context === null) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
};

export const useEditorState = (): EditorContextValue => {
  const { i18n } = usePrefs();
  const { profile, ballScroll, catalogSelection: profileCatalog } =
    useProfileCtx();
  const scope = useTriggerScope();
  const { buttonMappings, customMappings, catalogSelection } =
    useTriggerScopeMutations(scope);
  const [editor, setEditor] = useState<EditorMode | null>(null);

  const rejectDuplicateActivator = () => {
    publishToast(i18n.buttonMappingAlreadyRegistered);
    setEditor((previous) => {
      if (
        previous?.kind !== "button_mapping_activator" &&
        previous?.kind !== "ball_scroll_activator"
      ) {
        return previous;
      }
      return { ...previous, rejected: ACTIVATOR_REJECT_DUPLICATE };
    });
  };

  useKeyCapture(
    editor,
    setEditor,
    profile,
    async (slot, activator) => {
      if (profile === null) {
        return false;
      }
      const next = normalizeActivator(activator);
      if (
        findScopedActivatorConflict(profile, scope, next, {
          ballScrollSlot: slot,
        })
      ) {
        rejectDuplicateActivator();
        return false;
      }
      try {
        await ballScroll.assignActivator(slot, activator);
        return true;
      } catch (error) {
        if (error instanceof DuplicateActivatorError) {
          rejectDuplicateActivator();
        }
        return false;
      }
    },
    (entryId, combo) => {
      if (combo === null) {
        return false;
      }
      customMappings.updateActivator(entryId, combo);
      return true;
    },
    async (entryId, activator, draftEntry?: ButtonMappingEntry) => {
      if (profile === null) {
        return false;
      }
      const next = normalizeActivator(activator);
      if (
        findScopedActivatorConflict(profile, scope, next, {
          buttonMappingEntryId: entryId,
        })
      ) {
        rejectDuplicateActivator();
        return false;
      }
      try {
        if (draftEntry !== undefined) {
          buttonMappings.add({ ...draftEntry, activator: next });
          return true;
        }
        await buttonMappings.updateActivator(entryId, next);
        return true;
      } catch (error) {
        if (error instanceof DuplicateActivatorError) {
          rejectDuplicateActivator();
        }
        return false;
      }
    },
  );
  const selectButton = (
    buttonId: ButtonId,
    slot: ActionSlot,
    value: string,
  ) => {
    profileCatalog.selectButton(buttonId, slot, value, setEditor);
  };
  const selectButtonMapping = (
    entryId: string,
    slot: ActionSlot,
    value: string,
  ) => {
    catalogSelection.selectButtonMapping(entryId, slot, value, setEditor);
  };
  return {
    editor,
    setEditor,
    catalogSelection: {
      selectButton,
      selectButtonMapping,
      selectCustom: (entryId, slot, value) =>
        catalogSelection.selectCustom(entryId, slot, value, setEditor),
    },
  };
};
