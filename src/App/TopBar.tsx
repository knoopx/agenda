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
        { locale: store.locale },
      )}
    </div>
  );
});

const SyncIndicator = observer(() => {
  const store = useStore();

  if (store.webdav.isSyncing) {
    return (
      <div className="flex items-center space-x-1 mr-2">
        <IconMdiSync className="animate-spin text-base-0D w-4 h-4" />
        <span className="text-xs text-base-04">Syncing...</span>
      </div>
    );
  }

  if (store.isWebDAVConnected()) {
    return (
      <div className="flex items-center mr-2">
        <IconMdiCloudCheck className="text-base-0B w-4 h-4" />
      </div>
    );
  }

  return null;
});

const TopBar = observer(() => {
  return (
    <div className="w-full grid lg:grid-cols-2 lg:gap-4 xl:gap-8 mb-2 mx-auto p-2">
      <Input />
       <div className="hidden flex-auto items-center justify-between lg:flex">
        <Time />
        <Date />
        <div className="flex items-center">
          <SyncIndicator />
          <Popover.Root>
            <Settings />
            <Popover.PopoverTrigger>
              <IconMdiCog className="flex items-center justify-center text-base-04 hover:text-base-05 dark:hover:text-base-05 rounded cursor-pointer" />
            </Popover.PopoverTrigger>
          </Popover.Root>
        </div>
      </div>
    </div>
  );
});
export default TopBar;
