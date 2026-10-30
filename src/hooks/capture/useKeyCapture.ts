import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  applyKeyCapture,
  captureModeOf,
  captureSessionFor,
  resolveActivatorCapture,
} from "@/domain/capture";
import { comboFromDraft, CHORD_MODIFIERS } from "@/domain/profile";
import * as tauri from "@/services/tauri";
import type {
  Activator,
  ActivatorCapturePayload,
  BallScrollSlot,
  EditorMode,
  Profile,
} from "@/types";

const blockBrowserKeyEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
  if (
    event instanceof KeyboardEvent &&
    typeof event.stopImmediatePropagation === "function"
  ) {
    event.stopImmediatePropagation();
  }
};

export const useKeyCapture = (
  editor: EditorMode | null,
  setEditor: Dispatch<SetStateAction<EditorMode | null>>,
  profile: Profile | null,
  onActivatorAssigned: (
    slot: BallScrollSlot,
    activator: Activator,
  ) => boolean | Promise<boolean>,
  onComboAssigned: (
    entryId: string,
    combo: ReturnType<typeof comboFromDraft>,
  ) => boolean | Promise<boolean>,
  onButtonMappingAssigned: (
    entryId: string,
    activator: Activator,
  ) => boolean | Promise<boolean>,
) => {
  const editorRef = useRef(editor);
  editorRef.current = editor;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const onActivatorAssignedRef = useRef(onActivatorAssigned);
  onActivatorAssignedRef.current = onActivatorAssigned;
  const onComboAssignedRef = useRef(onComboAssigned);
  onComboAssignedRef.current = onComboAssigned;
  const onButtonMappingAssignedRef = useRef(onButtonMappingAssigned);
  onButtonMappingAssignedRef.current = onButtonMappingAssigned;
  const captureMode = captureModeOf(editor);
  const captureSession = useMemo(
    () => captureSessionFor(captureMode),
    [captureMode],
  );
  useEffect(() => {
    void tauri.applyCaptureSession(captureSession);
    return () => {
      void tauri.applyCaptureSession(tauri.CAPTURE_SESSION_OFF);
    };
  }, [captureSession, captureMode]);
  useEffect(() => {
    if (captureMode === "off") {
      return;
    }
    let cancelled = false;
    const unlistenPromise = import("@tauri-apps/api/event").then(
      async ({ listen }) => {
        const unsubs: Array<() => void> = [];
        if (
          captureMode === "custom_key" ||
          captureMode === "macro" ||
          captureMode === "combo_capture"
        ) {
          const unChord = await listen<{
            keys: string[];
            escape: boolean;
          }>("key-capture", (event) => {
            if (cancelled) {
              return;
            }
            const activeEditor = editorRef.current;
            if (activeEditor === null) {
              return;
            }
            const nextEditor = applyKeyCapture(
              activeEditor,
              captureMode,
              event.payload,
            );
            if (nextEditor === null) {
              setEditor(null);
            } else if (nextEditor !== activeEditor) {
              setEditor(nextEditor);
            }
          });
          unsubs.push(unChord);
        }
        if (
          captureMode === "ball_scroll" ||
          captureMode === "button_mapping_capture" ||
          captureMode === "combo_trigger" ||
          captureMode === "custom_key"
        ) {
          const unAct = await listen<ActivatorCapturePayload>(
            "activator-capture",
            (event) => {
              void (async () => {
                if (cancelled) {
                  return;
                }
                const activeEditor = editorRef.current;
                if (activeEditor === null) {
                  return;
                }
                const result = resolveActivatorCapture(
                  activeEditor,
                  event.payload,
                );
                if (result === null) {
                  return;
                }
                if (result.kind === "close") {
                  setEditor(null);
                  return;
                }
                if (result.kind === "reject") {
                  setEditor((previousEditor) => {
                    if (
                      previousEditor === null ||
                      (previousEditor.kind !== "ball_scroll_activator" &&
                        previousEditor.kind !== "button_mapping_activator" &&
                        previousEditor.kind !== "custom_combo_activator")
                    ) {
                      return previousEditor;
                    }
                    return { ...previousEditor, rejected: result.rejected };
                  });
                  return;
                }
                if (result.kind === "append_custom_key") {
                  setEditor((previousEditor) => {
                    if (previousEditor?.kind !== "custom_key") {
                      return previousEditor;
                    }
                    const modifiers = previousEditor.draft.filter((key) =>
                      CHORD_MODIFIERS.has(key),
                    );
                    return {
                      ...previousEditor,
                      draft: [...modifiers, result.token],
                    };
                  });
                  return;
                }
                if (result.kind === "assign_combo") {
                  const combo = comboFromDraft(result.chord, result.activator);
                  if (combo === null) {
                    return;
                  }
                  const accepted = await onComboAssignedRef.current(
                    result.entryId,
                    combo,
                  );
                  if (accepted) {
                    setEditor(null);
                  }
                  return;
                }
                if (result.kind === "assign_button_mapping") {
                  const accepted = await onButtonMappingAssignedRef.current(
                    result.entryId,
                    result.activator,
                  );
                  if (accepted) {
                    setEditor(null);
                  }
                  return;
                }
                const accepted = await onActivatorAssignedRef.current(
                  result.slot,
                  result.activator,
                );
                if (accepted) {
                  setEditor(null);
                }
              })();
            },
          );
          unsubs.push(unAct);
        }
        return () => {
          for (const unsubscribe of unsubs) {
            unsubscribe();
          }
        };
      },
    );
    const blockOpts: AddEventListenerOptions = { capture: true };
    window.addEventListener("keydown", blockBrowserKeyEvent, blockOpts);
    window.addEventListener("keyup", blockBrowserKeyEvent, blockOpts);
    window.addEventListener("keypress", blockBrowserKeyEvent, blockOpts);
    return () => {
      cancelled = true;
      void unlistenPromise.then((cleanup) => {
        if (cleanup !== undefined) {
          cleanup();
        }
      });
      window.removeEventListener("keydown", blockBrowserKeyEvent, blockOpts);
      window.removeEventListener("keyup", blockBrowserKeyEvent, blockOpts);
      window.removeEventListener("keypress", blockBrowserKeyEvent, blockOpts);
    };
  }, [captureMode, setEditor]);
};
