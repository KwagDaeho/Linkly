import {
  holdCapturePreviewContent,
  type HoldCapturePreview,
} from "@/domain/capture";
import { KeyChordPills } from "@/components/ui";
import * as chordPreviewStyles from "@/components/ui/ChordPreview.css";
import type { HoldCapturePhase, Lang } from "@/types";

interface HoldCapturePreviewViewProps {
  lang: Lang;
  labels: {
    listeningWaiting: string;
    inProgressTag: string;
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
      <>
        {content.statusText !== undefined ? (
          <span className={chordPreviewStyles.fieldStatus}>
            {content.statusText}
          </span>
        ) : null}
        <KeyChordPills
          lang={props.lang}
          keys={content.keys}
          size="compact"
          align="center"
        />
      </>
    );
  }
  return content.text;
};
