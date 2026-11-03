import { AppShell } from "@/components/layout";
import { AppProviders, ViewerProviders } from "@/components/providers";
import { EventViewerRoot } from "@/windows/EventViewerRoot";

const isEventViewerRoute = () => /^#\/viewer\/(keyboard|mouse)$/.test(window.location.hash);

const App = () => {
  if (isEventViewerRoute()) {
    return (
      <ViewerProviders>
        <EventViewerRoot />
      </ViewerProviders>
    );
  }
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
};
export default App;
