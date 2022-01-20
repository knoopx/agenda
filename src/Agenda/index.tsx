import { observer } from "mobx-react";

import { useStore } from "../hooks";

import Group from "./Group";

export const Agenda = observer(() => {
  const store = useStore();

  if (store.tasks.length === 0) {
    return (
      <div className="flex flex-auto items-center justify-center">
        <h1 className="text-neutral-400 text-xl">No tasks yet</h1>
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
