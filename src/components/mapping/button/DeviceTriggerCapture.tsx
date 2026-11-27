import { createPortal } from "react-dom";

import { ChordPreview, Button, Modal, ModalFooter, Muted } from "@/components/ui";
import { usePrefs } from "@/hooks";
import { useKeyRemapCapture } from "@/hooks/useKeyRemapCapture";

interface DeviceTriggerCaptureProps {
  deviceKey: string;
  deviceLabel: string;
  onCaptured: (keyName: string) => void;
  onCancel: () => void;
}

/** Captures the next physical key on one keyboard (raw HID — other keyboards ignored). */
export const DeviceTriggerCapture = (props: DeviceTriggerCaptureProps) => {
  const { i18n } = usePrefs();
  useKeyRemapCapture("device-trigger", props.deviceKey, (capture) =>
    props.onCaptured(capture.name),
  );
  // Portal: the trigger pages slide with a CSS transform + overflow clip, which would
  // trap a fixed-position modal inside them (only the backdrop blur showed).
  return createPortal(
    // No onEscape: Esc may be the key being captured.
    <Modal onBackdropClick={props.onCancel}>
      <h2>{i18n.deviceTriggerCaptureTitle.replace("{device}", props.deviceLabel)}</h2>
      <Muted variant="modal">{i18n.deviceTriggerCaptureHint}</Muted>
      <ChordPreview variant="field">{i18n.deviceTriggerCaptureWaiting}</ChordPreview>
      <ModalFooter>
        <Button variant="ghost" onClick={props.onCancel}>
          {i18n.cancel}
        </Button>
      </ModalFooter>
    </Modal>,
    document.body,
  );
};
