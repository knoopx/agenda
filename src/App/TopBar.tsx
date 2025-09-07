import { DateTime } from "luxon";
import { observer } from "mobx-react";
import * as Popover from "@radix-ui/react-popover";

import { now } from "../helpers";
import { useStore } from "../hooks";

import Input from "./Input";
import Settings from "./Settings";
import IconMdiSync from "~icons/mdi/sync.jsx";
import IconMdiCloudCheck from "~icons/mdi/cloud-check.jsx";
import IconMdiCog from "~icons/mdi/cog.jsx";

const Date = () => {
  return (
    <h1 className="flex-auto font-medium text-center text-lg text-base-05">
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
    <div className="font-medium text-base-04">
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
      <div className="flex items-center mr-2">
        <IconMdiSync className="animate-spin text-base-0D w-5 h-5" />
      </div>
    );
  }

  if (store.isWebDAVConnected()) {
    return (
      <div className="flex items-center mr-2">
        <IconMdiCloudCheck className="text-base-0B w-5 h-5" />
      </div>
    );
  }

  return null;
});

const TopBar = observer(() => {
  return (
    <div className="w-full mb-2 mx-auto p-2">
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-4 xl:gap-8">
        <div className="flex items-center lg:flex-row lg:items-center">
          <div className="flex-auto">
            <Input />
          </div>
          <div className="flex items-center ml-6 lg:hidden">
            <SyncIndicator />
            <Popover.Root>
              <Settings />
              <Popover.PopoverTrigger>
                <IconMdiCog className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-base-04 hover:text-base-05 dark:hover:text-base-05 rounded cursor-pointer p-3 min-w-[44px] min-h-[44px]" />
              </Popover.PopoverTrigger>
            </Popover.Root>
          </div>
        </div>
        <div className="hidden lg:flex px-4 lg:px-16 flex-auto items-center justify-between">
          <div className="flex flex-auto items-center space-x-4">
            <Time />
            <Date />
          </div>
          <div className="flex items-center">
            <SyncIndicator />
            <Popover.Root>
              <Settings />
              <Popover.PopoverTrigger>
                <IconMdiCog className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-base-04 hover:text-base-05 dark:hover:text-base-05 rounded cursor-pointer p-2" />
              </Popover.PopoverTrigger>
            </Popover.Root>
          </div>
        </div>
      </div>
    </div>
  );
});
export default TopBar;
