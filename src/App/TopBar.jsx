import { DateTime } from "luxon"
import { observer } from "mobx-react-lite"

import { useStore } from "../Store"

import Input from "./Input"

const Settings = observer(() => {
  const store = useStore()

  return (
    <div className="flex flex-auto items-center justify-between text-shadow">
      <h1 className="font-medium text-xl">
        {DateTime.now().toLocaleString(DateTime.DATE_FULL)}
      </h1>

      <div className="space-x-4 text-xs">
        <select
          value={store.locale}
          onChange={(e) => store.setLocale(e.target.value)}
          className="bg-transparent border-none appearance-none outline-none"
        >
          <option value="en-US">en-US</option>
          <option value="es-ES">es-ES</option>
        </select>

        <select
          value={store.timeZone}
          onChange={(e) => store.setTimeZone(e.target.value)}
          className="bg-transparent border-none appearance-none outline-none"
        >
          <option value="UTC">UTC</option>
          <option value="Europe/Madrid">Europe/Madrid</option>
        </select>
      </div>
    </div>
  )
})

const TopBar = observer(() => {
  return (
    <div className="text-white bg-purple-700">
      <div className="container grid grid-cols-2 gap-16 mb-8 mx-auto py-2">
        <Settings />
        <Input />
      </div>
    </div>
  )
})
export default TopBar
