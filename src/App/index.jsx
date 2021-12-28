import { observer } from "mobx-react"

import { Agenda } from "../Agenda"
import Calendar from "../Calendar"

import TopBar from "./TopBar"

const App = observer(() => {
  return (
    <div className="container mx-auto py-8 font-sans-serif">
      <TopBar />
      <div className="grid grid-cols-2 gap-16">
        <Agenda />
        <Calendar />
      </div>
    </div>
  )
})

export default App
