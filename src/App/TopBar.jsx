import { observer } from "mobx-react"

import Input from "./Input"
import Settings from "./Settings"

const TopBar = observer(() => {
  return (
    <div className="text-white bg-neutral-700">
      <div className="container grid grid-cols-2 gap-16 mb-8 mx-auto px-8 py-2">
        <Settings />
        <Input />
      </div>
    </div>
  )
})
export default TopBar
