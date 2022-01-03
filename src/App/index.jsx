import { observer } from "mobx-react"

import { Agenda } from "../Agenda"
import Calendar from "../Calendar"

import TopBar from "./TopBar"

const App = observer(() => {
  return (
    <div className="font-sans-serif">
      <TopBar />
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-2 gap-16">
          <Calendar />
          <Agenda />
        </div>
      </div>
    </div>
  )
})

export default App
