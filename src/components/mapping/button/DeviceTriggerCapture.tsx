import { CapturePromptModal } from "@/components/editors/shared";
import { usePrefs } from "@/hooks";
import { useKeyRemapCapture } from "@/hooks/useKeyRemapCapture";
import { fillTemplate } from "@/i18n";

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
  // No Esc close: Esc may be the key being captured.
  return (
    <CapturePromptModal
      title={fillTemplate(i18n.deviceTriggerCaptureTitle, {
        device: props.deviceLabel,
      })}
      hint={i18n.deviceTriggerCaptureHint}
      status={i18n.deviceTriggerCaptureWaiting}
      cancelLabel={i18n.cancel}
      onCancel={props.onCancel}
      closeOnBackdrop
      portal
    />
  );
};
