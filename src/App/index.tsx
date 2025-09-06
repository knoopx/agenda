import { observer } from "mobx-react";

import { Agenda } from "../Agenda";
import Calendar from "../Calendar";
import { useGlobalKeyboard } from "../hooks";

import TopBar from "./TopBar";

const App = observer(() => {
  useGlobalKeyboard();

  return (
    <div className="flex flex-col overflow-hidden min-h-screen max-h-screen font-sans-serif dark:bg-base-00 dark:text-base-05">
      <TopBar />
      <div className="w-full flex flex-auto mx-auto px-2 min-h-0">
        <div className="grid flex-auto lg:grid-cols-2 lg:gap-4 xl:gap-8">
          <div className="flex flex-col overflow-y-auto">
            <Agenda />
          </div>
          <Calendar className="hidden flex-auto lg:flex w-full" />
        </div>
      </div>
    </div>
  );
});

export default App;
