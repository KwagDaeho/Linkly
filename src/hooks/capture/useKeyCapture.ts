import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  applyKeyCapture,
  CAPTURE_HOLD_MS,
  captureModeOf,
  captureSessionFor,
  comboActivatorToSnapshot,
  ensurePointerHitTracking,
  hitCaptureCancelAtPointer,
  mergeCaptureSnapshot,
  normalizeCaptureSnapshot,
  resolveActivatorCapture,
  snapshotIsValidCombo,
  snapshotIsValidCustomKey,
  snapshotToComboActivator,
  stopHoldListening,
} from "@/domain/capture";
import type {
  Activator,
  ActivatorCapturePayload,
  BallScrollSlot,
  ButtonMappingEntry,
  ComboActivator,
  ComboTriggerCapturePayload,
  EditorMode,
  KeyCapturePayload,
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

const patchHoldEditor = (
  editor: EditorMode,
  snapshot: string[],
  phase: "recognizing" | "confirmed",
): EditorMode => {
  if (editor.kind === "custom_key") {
    if (phase === "confirmed") {
      return {
        ...editor,
        listening: false,
        holdPhase: "confirmed",
        pending: [],
        confirmed: snapshot,
      };
    }
    return {
      ...editor,
      holdPhase: snapshot.length > 0 ? "recognizing" : "idle",
      pending: snapshot,
    };
  }
  if (editor.kind === "custom_combo_activator") {
    if (phase === "confirmed") {
      return {
        ...editor,
        listening: false,
        holdPhase: "confirmed",
        pending: [],
        confirmed: snapshot,
        rejected: null,
      };
    }
    return {
      ...editor,
      holdPhase: snapshot.length > 0 ? "recognizing" : "idle",
      pending: snapshot,
      rejected: null,
    };
  }
  return editor;
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
    combo: ComboActivator | null,
  ) => boolean | Promise<boolean>,
  onButtonMappingAssigned: (
    entryId: string,
    activator: Activator,
    draftEntry?: ButtonMappingEntry,
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
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdSnapshotRef = useRef<string>("");

  const captureMode = captureModeOf(editor);
  const captureSession = useMemo(
    () => captureSessionFor(captureMode),
    [captureMode],
  );

  const clearHoldTimer = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const exitHoldListening = () => {
    clearHoldTimer();
    holdSnapshotRef.current = "";
    setEditor((previousEditor) => {
      if (previousEditor === null) {
        return previousEditor;
      }
      return stopHoldListening(previousEditor);
    });
  };

  const confirmHoldCapture = (snapshot: string[]) => {
    clearHoldTimer();
    holdSnapshotRef.current = "";
    const activeEditor = editorRef.current;
    if (activeEditor === null) {
      return;
    }
    if (activeEditor.kind === "custom_key") {
      if (!snapshotIsValidCustomKey(snapshot)) {
        return;
      }
      setEditor(patchHoldEditor(activeEditor, snapshot, "confirmed"));
      return;
    }
    if (activeEditor.kind === "custom_combo_activator") {
      if (
        snapshotToComboActivator(snapshot) === null ||
        !snapshotIsValidCombo(snapshot)
      ) {
        return;
      }
      setEditor(patchHoldEditor(activeEditor, snapshot, "confirmed"));
    }
  };

  const scheduleHoldCommit = (snapshot: string[]) => {
    clearHoldTimer();
    const normalized = normalizeCaptureSnapshot(snapshot);
    const key = normalized.join("\0");
    if (normalized.length === 0) {
      holdSnapshotRef.current = "";
      return;
    }
    if (key === holdSnapshotRef.current && holdTimerRef.current !== null) {
      return;
    }
    holdSnapshotRef.current = key;
    holdTimerRef.current = setTimeout(() => {
      confirmHoldCapture(normalized);
      holdTimerRef.current = null;
    }, CAPTURE_HOLD_MS);
  };

  const applyHoldPreview = (snapshot: string[]) => {
    const normalized = mergeCaptureSnapshot(snapshot);
    setEditor((previousEditor) => {
      if (
        previousEditor?.kind !== "custom_key" &&
        previousEditor?.kind !== "custom_combo_activator"
      ) {
        return previousEditor;
      }
      if (!previousEditor.listening) {
        return previousEditor;
      }
      return patchHoldEditor(previousEditor, normalized, "recognizing");
    });
    if (normalized.length === 0) {
      clearHoldTimer();
      holdSnapshotRef.current = "";
      setEditor((previousEditor) => {
        if (
          previousEditor?.kind !== "custom_key" &&
          previousEditor?.kind !== "custom_combo_activator"
        ) {
          return previousEditor;
        }
        if (!previousEditor.listening) {
          return previousEditor;
        }
        return patchHoldEditor(previousEditor, [], "recognizing");
      });
      return;
    }
    scheduleHoldCommit(normalized);
  };

  useEffect(() => {
    void import("@/services/tauri").then((tauri) => {
      void tauri.applyCaptureSession(captureSession);
    });
    return () => {
      clearHoldTimer();
      void import("@/services/tauri").then((tauri) => {
        void tauri.applyCaptureSession(tauri.CAPTURE_SESSION_OFF);
      });
    };
  }, [captureMode, captureSession]);

  useEffect(() => {
    ensurePointerHitTracking();
  }, []);

  useEffect(() => {
    if (captureMode === "off") {
      return;
    }
    let cancelled = false;
    const unlistenPromise = import("@tauri-apps/api/event").then(
      async ({ listen }) => {
        const unsubs: Array<() => void> = [];

        if (captureMode === "chord_hold") {
          const unChord = await listen<KeyCapturePayload>(
            "key-capture",
            (event) => {
              if (cancelled) {
                return;
              }
              if (event.payload.escape) {
                exitHoldListening();
                return;
              }
              applyHoldPreview(event.payload.keys);
            },
          );
          unsubs.push(unChord);

          const unCombo = await listen<ComboTriggerCapturePayload>(
            "combo-trigger-capture",
            (event) => {
              if (cancelled) {
                return;
              }
              if (event.payload.escape) {
                exitHoldListening();
                return;
              }
              if (event.payload.combo !== null) {
                applyHoldPreview(
                  comboActivatorToSnapshot(event.payload.combo),
                );
              }
            },
          );
          unsubs.push(unCombo);

        }

        if (
          captureMode === "chord_hold" ||
          captureMode === "button_mapping_capture" ||
          captureMode === "ball_scroll"
        ) {
          const unLeft = await listen("capture-left-pointer", () => {
            if (cancelled) {
              return;
            }
            const activeEditor = editorRef.current;
            if (activeEditor === null) {
              return;
            }
            if (activeEditor.kind === "ball_scroll_activator") {
              if (hitCaptureCancelAtPointer()) {
                setEditor(null);
                return;
              }
              void (async () => {
                const accepted = await onActivatorAssignedRef.current(
                  activeEditor.slot,
                  { type: "device", button: "left" },
                );
                if (accepted) {
                  setEditor(null);
                }
              })();
              return;
            }
            if (activeEditor.kind === "button_mapping_activator") {
              if (!activeEditor.listening) {
                return;
              }
              if (hitCaptureCancelAtPointer()) {
                setEditor(null);
                return;
              }
              void (async () => {
                const accepted = await onButtonMappingAssignedRef.current(
                  activeEditor.entryId,
                  { type: "device", button: "left" },
                  activeEditor.draftEntry,
                );
                if (accepted) {
                  setEditor(null);
                }
              })();
              return;
            }
            if (
              activeEditor.kind !== "custom_key" &&
              activeEditor.kind !== "custom_combo_activator"
            ) {
              return;
            }
            if (!activeEditor.listening) {
              return;
            }
            if (hitCaptureCancelAtPointer()) {
              exitHoldListening();
              return;
            }
            void import("@/services/tauri").then((tauri) => {
              void tauri.mergeComboCaptureToken("MouseLeft");
            });
          });
          unsubs.push(unLeft);
        }

        if (captureMode === "macro" || captureMode === "combo_capture") {
          const unChord = await listen<KeyCapturePayload>(
            "key-capture",
            (event) => {
              if (cancelled) {
                return;
              }
              const activeEditor = editorRef.current;
              if (activeEditor === null) {
                return;
              }
              const nextEditor = applyKeyCapture(
                activeEditor,
                captureMode === "macro" ? "macro" : "combo_capture",
                event.payload,
              );
              if (nextEditor === null) {
                setEditor(null);
              } else if (nextEditor !== activeEditor) {
                setEditor(nextEditor);
              }
            },
          );
          unsubs.push(unChord);
        }

        if (
          captureMode === "ball_scroll" ||
          captureMode === "button_mapping_capture" ||
          captureMode === "combo_trigger"
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
                if (result.kind === "stop_listening") {
                  exitHoldListening();
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
                if (result.kind === "assign_combo") {
                  const combo = snapshotToComboActivator([
                    ...result.chord,
                    ...(result.activator.type === "key"
                      ? [result.activator.name]
                      : []),
                  ]);
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
                  if (
                    activeEditor?.kind !== "button_mapping_activator" ||
                    !activeEditor.listening
                  ) {
                    return;
                  }
                  const draftEntry =
                    activeEditor.draftEntry !== undefined
                      ? activeEditor.draftEntry
                      : undefined;
                  const accepted = await onButtonMappingAssignedRef.current(
                    result.entryId,
                    result.activator,
                    draftEntry,
                  );
                  if (accepted) {
                    setEditor(null);
                  }
                  return;
                }
                if (result.kind === "assign") {
                  const accepted = await onActivatorAssignedRef.current(
                    result.slot,
                    result.activator,
                  );
                  if (accepted) {
                    setEditor(null);
                  }
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
      clearHoldTimer();
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
