import { createContext, useContext, useState } from "react";
import { useKeyCapture } from "@/hooks/capture/useKeyCapture";
import { useProfileCtx } from "@/hooks/profile";
import { useTriggerScope } from "@/hooks/trigger/TriggerScopeContext";
import { useTriggerScopeMutations } from "@/hooks/trigger/useTriggerScopeMutations";
import { activatorsEqual, buttonMappingsOf } from "@/domain/profile";
import { normalizeActivator } from "@/domain/profile/mouseButton";
import { useToast } from "@/components/ui/toast/ToastContext";
import { usePrefs } from "@/hooks/prefs/usePrefs";
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
  const { profile, ballScroll, catalogSelection: profileCatalog } =
    useProfileCtx();
  const scope = useTriggerScope();
  const { buttonMappings, customMappings, catalogSelection } =
    useTriggerScopeMutations(scope);
  const { showToast } = useToast();
  const { i18n } = usePrefs();
  const [editor, setEditor] = useState<EditorMode | null>(null);
  useKeyCapture(
    editor,
    setEditor,
    profile,
    async (slot, activator) => {
      try {
        await ballScroll.assignActivator(slot, activator);
        return true;
      } catch {
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
      try {
        const next = normalizeActivator(activator);
        if (profile !== null) {
          const duplicate = buttonMappingsOf(profile).some(
            (row) =>
              row.activator !== null &&
              activatorsEqual(normalizeActivator(row.activator), next) &&
              row.id !== entryId &&
              row.id !== draftEntry?.id,
          );
          if (duplicate) {
            showToast(i18n.buttonMappingAlreadyRegistered);
            return false;
          }
        }
        if (draftEntry !== undefined) {
          buttonMappings.add({ ...draftEntry, activator: next });
          return true;
        }
        await buttonMappings.updateActivator(entryId, next);
        return true;
      } catch {
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
