import { DateTime } from "luxon"
import { observer } from "mobx-react-lite"

import { useStore } from "../Store"

import Input from "./Input"

const Settings = observer(() => {
  const store = useStore()

  return (
    <div className="flex justify-between">
      <h1 className="font-bold text-xl">
        {DateTime.now().toLocaleString(DateTime.DATE_FULL)}
      </h1>

      <div className="space-x-4">
        <select
          value={store.locale}
          onChange={(e) => store.setLocale(e.target.value)}
          className="font-medium bg-transparent"
        >
          <option value="en-US">en-US</option>
          <option value="es-ES">es-ES</option>
        </select>

        <select
          value={store.timeZone}
          onChange={(e) => store.setTimeZone(e.target.value)}
          className="font-medium bg-transparent"
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
    <div className="grid grid-cols-2 gap-16 mb-8">
      <Input />
      <Settings />
    </div>
  )
})
export default TopBar
