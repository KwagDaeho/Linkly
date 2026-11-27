import { activatorCaptureGraceActive } from "./captureArm";
import { hitCaptureIgnoresActivatorsAtPointer } from "@/utils/pointerHit";

/** Drop spurious catalog / pointer capture while arming or over mapping UI. */
export const shouldDropActivatorCaptureEvent = (): boolean =>
  activatorCaptureGraceActive() || hitCaptureIgnoresActivatorsAtPointer();
