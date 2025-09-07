import { observer } from "mobx-react";

import { Agenda } from "../Agenda";
import Calendar from "../Calendar";
import { useGlobalKeyboard, useStore } from "../hooks";

import TopBar from "./TopBar";

const App = observer(() => {
  useGlobalKeyboard();
  const store = useStore();

  return (
    <div className="flex flex-col overflow-hidden min-h-screen max-h-screen font-sans-serif dark:bg-base-00 dark:text-base-05">
      <TopBar />
      <div className="w-full flex flex-auto mx-auto px-2 min-h-0">
        <div className="grid flex-auto lg:grid-cols-2 lg:gap-4 xl:gap-8">
          <div className="flex flex-col overflow-y-auto">
            <Agenda />
          </div>
          <Calendar className="hidden flex-auto lg:flex w-full overflow-y-auto" />
        </div>
      </div>

      {/* Startup sync indicator */}
      {store.webdav.isSyncing && store.webdav.isConfigured() && (
        <div className="fixed bottom-4 right-4 bg-base-05 dark:bg-base-01 border border-base-03 dark:border-base-02 rounded-lg px-4 py-2 shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <IconMdiSync className="animate-spin text-base-0D" />
            <span className="text-sm text-base-04">Syncing with server...</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default App;
