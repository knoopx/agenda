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
        "flex items-center justify-center text-neutral-500 hover:text-black rounded cursor-pointer",
        className
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
        "bg-neutral-100 rounded px-2 py-1 border-none appearance-none outline-none",
        className
      )}
      {...props}
    />
  );
};

const Settings = observer(() => {
  const store = useStore();

  return (
    <Popover.Content className="flex flex-auto flex-col p-4 text-xs bg-white rounded border border-neutral-300 shadow">
      <Popover.Arrow className="fill-neutral-300" />

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <span className="font-medium">Times of the day</span>
          <div className="flex flex-col space-y-1">
            {Object.keys(store.timeOfTheDay).map((key) => (
              <label key={key} className="flex space-x-4">
                <span className="flex-auto">{key}</span>
                <Select
                  className="text-right"
                  value={store.timeOfTheDay[key as keyof ITimeOfTheDay]}
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
