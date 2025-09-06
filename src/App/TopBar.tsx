import { DateTime } from "luxon";
import { observer } from "mobx-react";
import * as Popover from "@radix-ui/react-popover";

import { now } from "../helpers";
import { useStore } from "../hooks";

import Input from "./Input";
import Settings from "./Settings";

const Date = () => {
  return (
    <h1 className="flex-auto font-medium text-center text-lg">
      {DateTime.now().toLocaleString({
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })}
    </h1>
  );
};

const Time = observer(() => {
  const store = useStore();

  return (
    <div>
      {now().toLocaleString(
        { hour: "2-digit", minute: "2-digit" },
        { locale: store.locale }
      )}
    </div>
  );
});

const TopBar = observer(() => {
  return (
    <div className="w-full grid lg:grid-cols-2 lg:gap-4 xl:gap-8 mb-2 mx-auto p-2">
      <Input />
      <div className="hidden flex-auto lg:flex items-center justify-between">
        <Time />
        <Date />
        <Popover.Root>
          <Settings />
          <Popover.PopoverTrigger>
            <IconMdiCog className="flex items-center justify-center text-base-04 hover:text-base-05 dark:hover:text-base-05 rounded cursor-pointer" />
          </Popover.PopoverTrigger>
        </Popover.Root>
      </div>
    </div>
  );
});
export default TopBar;
