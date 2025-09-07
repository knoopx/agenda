import { observer } from "mobx-react";

import { useStore } from "../hooks";

import Group from "./Group";

export const Agenda = observer(() => {
  const store = useStore();

  if (store.tasks.length === 0) {
    return (
      <div className="flex flex-auto items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-02/50 flex items-center justify-center">
            <IconMdiPlaylistPlus className="w-8 h-8 text-base-04" />
          </div>
          <h1 className="text-base-04 text-xl font-medium">No tasks yet</h1>
          <p className="text-base-04/70 text-sm max-w-xs">
            Add your first task using the input field above to get started with
            your productivity journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <table className="w-full">
      {store.agenda.groupEntries.map(([name, tasks]) => (
        <Group key={name} name={name} tasks={tasks} />
      ))}
    </table>
  );
});
