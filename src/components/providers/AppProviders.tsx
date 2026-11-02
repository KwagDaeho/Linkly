import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast/ToastContext";
import { InputDevicesProvider } from "@/hooks/useInputDevices";
import { EditorProvider } from "./EditorProvider";
import { PrefsProvider } from "./PrefsProvider";
import { ProfileProvider } from "./ProfileProvider";
import { SessionProvider } from "./SessionProvider";
interface AppProvidersProps {
  children: ReactNode;
}
export const AppProviders = (props: AppProvidersProps) => {
  return (
    <PrefsProvider>
      <ProfileProvider>
        <ToastProvider>
          <InputDevicesProvider>
            <EditorProvider>
              <SessionProvider>{props.children}</SessionProvider>
            </EditorProvider>
          </InputDevicesProvider>
        </ToastProvider>
      </ProfileProvider>
    </PrefsProvider>
  );
};
