import { AppShell } from "@/components/layout";
import { EventViewerRoot } from "@/windows/EventViewerRoot";
import { AppProviders } from "./providers";

const isEventViewerRoute = () =>
  /^#\/viewer\/(keyboard|mouse)$/.test(window.location.hash);

const App = () => {
  if (isEventViewerRoute()) {
    return (
      <AppProviders>
        <EventViewerRoot />
      </AppProviders>
    );
  }
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
};
export default App;
