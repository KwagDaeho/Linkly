import {
  holdCapturePreviewContent,
  type HoldCapturePreview,
} from "@/domain/capture";
import { KeyChordPills } from "@/components/ui";
import type { HoldCapturePhase, Lang } from "@/types";

interface HoldCapturePreviewViewProps {
  lang: Lang;
  labels: {
    inProgressTag: string;
    idlePrompt: string;
    waitingStart: string;
  };
  state: {
    listening: boolean;
    holdPhase: HoldCapturePhase;
    pending: string[];
    confirmed: string[];
  };
}

export const HoldCapturePreviewView = (props: HoldCapturePreviewViewProps) => {
  const content: HoldCapturePreview = holdCapturePreviewContent(
    props.labels,
    props.state,
  );
  if (content.kind === "tokens") {
    return (
      <KeyChordPills
        lang={props.lang}
        keys={content.keys}
        prefix={content.prefix}
        size="compact"
        align="center"
      />
    );
  }
  return content.text;
};
