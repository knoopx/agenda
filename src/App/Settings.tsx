import classNames from "classnames";
import { range } from "lodash";
import { observer } from "mobx-react";
import * as Popover from "@radix-ui/react-popover";

import { useStore } from "../hooks";
import { ButtonHTMLAttributes, SelectHTMLAttributes, useState } from "react";
import { ITimeOfTheDay } from "../models/Store";
import IconMdiSync from "~icons/mdi/sync.jsx";
import IconMdiClose from "~icons/mdi/close.jsx";
import IconMdiCloudUpload from "~icons/mdi/cloud-upload.jsx";
import IconMdiAlertCircle from "~icons/mdi/alert-circle.jsx";
import IconMdiCheckCircle from "~icons/mdi/check-circle.jsx";
import IconMdiWeatherSunny from "~icons/mdi/weather-sunny.jsx";
import IconMdiWeatherNight from "~icons/mdi/weather-night.jsx";
import IconMdiContentCopy from "~icons/mdi/content-copy.jsx";
import IconMdiContentPaste from "~icons/mdi/content-paste.jsx";
import IconMdiTrashCanOutline from "~icons/mdi/trash-can-outline.jsx";

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
  const [webdavStatus, setWebdavStatus] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);

  const connectAndSync = async () => {
    setIsConnecting(true);
    setWebdavStatus("");

    try {
      const success = await store.connectAndSync();
      setWebdavStatus(success ? "Connected and synced!" : "Connection failed!");
    } catch (error) {
      setWebdavStatus(
        `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const forceSyncNow = async () => {
    setIsForceSyncing(true);
    setWebdavStatus("");

    try {
      await store.forceSyncNow();
      setWebdavStatus("Force sync completed!");
    } catch (error) {
      setWebdavStatus(
        `Force sync failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsForceSyncing(false);
    }
  };

  return (
    <Popover.Content className="flex flex-auto flex-col p-4 text-xs bg-base-01 border border-base-04 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
      <Popover.Arrow className="fill-base-04" />

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
            className="w-4 h-4 rounded border-2 border-base-04 bg-base-01 checked:bg-base-0D checked:border-base-0D focus:ring-2 focus:ring-base-0D focus:ring-offset-0 hover:border-base-0D appearance-none relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:font-bold checked:after:text-xs"
            checked={store.displayEmoji}
            onChange={() => store.toggleDisplayEmoji()}
          />
          <span className="font-medium">show emoji</span>
        </label>

        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">WebDAV Sync</span>
            {store.isWebDAVConnected() && (
              <div className="flex items-center space-x-1 text-xs text-base-0B">
                <div className="w-2 h-2 bg-base-0B rounded-full"></div>
                <span>Connected</span>
              </div>
            )}
          </div>

          {store.isWebDAVConnected() ? (
            // Connected state - show server info and controls
            <div className="flex flex-col space-y-3">
              <div className="p-2 bg-base-02 dark:bg-base-02 rounded border border-base-03">
                <div className="text-xs font-mono break-all">
                  {store.webdav.url}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={forceSyncNow}
                  disabled={isForceSyncing}
                  className="px-3 py-1 bg-base-0D hover:bg-base-0D text-base-00 rounded disabled:bg-base-04 disabled:text-base-01 disabled:cursor-not-allowed text-xs font-medium"
                >
                  {isForceSyncing ? (
                    <span className="flex items-center space-x-1">
                      <div className="w-3 h-3 border border-base-00 border-t-transparent rounded-full animate-spin"></div>
                      <span>Syncing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <IconMdiSync className="w-4 h-4" />
                      <span>Sync Now</span>
                    </span>
                  )}
                </Button>

                <Button
                  onClick={() => {
                    store.webdav.setUrl("");
                    store.webdav.setUsername("");
                    store.webdav.setPassword("");
                    store.webdav.setSyncError(undefined);
                    setWebdavStatus("");
                  }}
                  className="px-3 py-1 bg-base-08 hover:bg-base-08 text-base-00 rounded text-xs font-medium"
                >
                  <span className="flex items-center space-x-1">
                    <IconMdiClose className="w-4 h-4" />
                    <span>Disconnect</span>
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            // Not connected state - show connection form
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col space-y-2">
                <div>
                  <label className="block text-xs text-base-04 mb-1">
                    Server URL
                  </label>
                  <input
                    type="url"
                    className="w-full bg-base-01 rounded px-3 py-2 border border-base-03 outline-none focus:border-base-0D text-sm"
                    placeholder="https://example.com/webdav/"
                    value={store.webdav.url}
                    onChange={(e) => store.webdav.setUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-base-04 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full bg-base-01 rounded px-3 py-2 border border-base-03 outline-none focus:border-base-0D text-sm"
                      placeholder="Username"
                      value={store.webdav.username}
                      onChange={(e) => store.webdav.setUsername(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-base-04 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      className="w-full bg-base-01 rounded px-3 py-2 border border-base-03 outline-none focus:border-base-0D text-sm"
                      placeholder="Password"
                      value={store.webdav.password}
                      onChange={(e) => store.webdav.setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={connectAndSync}
                disabled={isConnecting || !store.webdav.isConfigured()}
                className="px-4 py-2 bg-base-0D hover:bg-base-0D text-base-00 rounded disabled:bg-base-04 disabled:text-base-01 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isConnecting ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-base-00 border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <IconMdiCloudUpload className="w-4 h-4" />
                    <span>Connect & Sync</span>
                  </span>
                )}
              </Button>
            </div>
          )}

          {(store.webdav.syncError || webdavStatus) && (
            <div
              className={`text-xs px-3 py-2 rounded border ${
                store.webdav.syncError || webdavStatus?.includes("failed")
                  ? "bg-base-08 text-base-00 border-base-08 dark:bg-base-08 dark:text-base-00"
                  : "bg-base-0B text-base-00 border-base-0B dark:bg-base-0B dark:text-base-00"
              }`}
            >
              <div className="flex items-start space-x-2">
                {store.webdav.syncError || webdavStatus?.includes("failed") ? (
                  <IconMdiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <IconMdiCheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{store.webdav.syncError || webdavStatus}</span>
              </div>
            </div>
          )}

          {store.webdav.lastSync && (
            <div className="text-xs text-base-04">
              Last sync: {new Date(store.webdav.lastSync).toLocaleString()}
            </div>
          )}
        </div>

        <div className="flex justify-between space-x-4">
          <Button
            onClick={() => {
              store.toggleDarkMode();
            }}
          >
            {store.useDarkMode ? (
              <IconMdiWeatherSunny className="w-4 h-4" />
            ) : (
              <IconMdiWeatherNight className="w-4 h-4" />
            )}
          </Button>

          <Button
            onClick={() => {
              store.copyListToClipboard();
            }}
          >
            <IconMdiContentCopy className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => {
              store.importListFromClipboard();
            }}
          >
            <IconMdiContentPaste className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => {
              store.clearAll();
            }}
          >
            <IconMdiTrashCanOutline className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Popover.Content>
  );
});

export default Settings;
