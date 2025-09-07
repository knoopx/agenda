import classNames from "classnames";
import { range } from "lodash";
import { observer } from "mobx-react";
import * as Popover from "@radix-ui/react-popover";

import { useStore } from "../hooks";
import { ButtonHTMLAttributes, SelectHTMLAttributes } from "react";
import { ITimeOfTheDay } from "../models/Store";

export const Button = ({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type="button"
      className={classNames(
        "flex items-center justify-center text-base-04 hover:text-base-05 rounded cursor-pointer",
        className,
      )}
      {...props}
    />
  );
};

export const Select = ({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      className={classNames(
        "bg-base-01 rounded px-2 py-1 border-none appearance-none outline-none",
        className,
      )}
      {...props}
    />
  );
};

const Settings = observer(() => {
  const store = useStore();

  return (
    <Popover.Content className="flex flex-auto flex-col p-4 text-xs bg-base-05 dark:bg-base-01 rounded border border-base-03 dark:border-base-02 shadow">
      <Popover.Arrow className="fill-base-03 dark:fill-base-02" />

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <span className="font-medium">Times of the day</span>
          <div className="flex flex-col space-y-1">
            {Object.keys(store.timeOfTheDay).map((key) => (
              <label key={key} className="flex space-x-4">
                <span className="flex-auto">{key}</span>
                <Select
                  className="text-right"
                  value={
                    (
                      store.timeOfTheDay as ITimeOfTheDay &
                        Record<string, number>
                    )[key]
                  }
                  onChange={(e) =>
                    store.timeOfTheDay.set(key, Number(e.target.value))
                  }
                >
                  {range(0, 24).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}:00
                    </option>
                  ))}
                </Select>
              </label>
            ))}
          </div>
        </div>

        <label className="flex flex-col space-y-1">
          <span className="font-medium">Time format</span>
          <Select
            value={store.locale}
            onChange={(e) => store.setLocale(e.target.value)}
          >
            <option value="en-US">en-US</option>
            <option value="es-ES">es-ES</option>
          </Select>
        </label>

        <label className="flex flex-col space-y-1">
          <span className="font-medium">Time zone</span>
          <Select
            value={store.timeZone}
            onChange={(e) => store.setTimeZone(e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Madrid">Europe/Madrid</option>
          </Select>
        </label>

        <label className="inline-flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-2 border-base-04 bg-base-01 checked:bg-base-0D checked:border-base-0D focus:ring-2 focus:ring-base-0D/50 focus:ring-offset-0 hover:border-base-0D/70 appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:font-bold checked:after:text-xs"
            checked={store.displayEmoji}
            onChange={() => store.toggleDisplayEmoji()}
          />
          <span className="font-medium">show emoji</span>
        </label>

        <div className="flex justify-between space-x-4">
          <Button
            onClick={() => {
              store.toggleDarkMode();
            }}
          >
            {store.useDarkMode ? (
              <IconMdiWeatherSunny />
            ) : (
              <IconMdiWeatherNight />
            )}
          </Button>

          <Button
            onClick={() => {
              store.copyListToClipboard();
            }}
          >
            <IconMdiContentCopy />
          </Button>

          <Button
            onClick={() => {
              store.importListFromClipboard();
            }}
          >
            <IconMdiContentPaste />
          </Button>

          <Button
            onClick={() => {
              store.clearAll();
            }}
          >
            <IconMdiTrashCanOutline />
          </Button>
        </div>
      </div>
    </Popover.Content>
  );
});

export default Settings;
