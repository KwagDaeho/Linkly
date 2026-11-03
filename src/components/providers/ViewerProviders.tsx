import type { ReactNode } from "react";

import { PrefsProvider } from "./PrefsProvider";

interface ViewerProvidersProps {
  children: ReactNode;
}

/** Event viewer windows — prefs/i18n only (no HID poll or permission tap refresh). */
export const ViewerProviders = (props: ViewerProvidersProps) => {
  return <PrefsProvider>{props.children}</PrefsProvider>;
};
