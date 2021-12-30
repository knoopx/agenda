import React from "react"
import ReactDOM from "react-dom"

import "./index.css"

import { onSnapshot } from "mobx-state-tree"

import App from "./App"
import { Store } from "./models"
import { StoreContext } from "./hooks/useStore"

const store = Store.create(JSON.parse(localStorage.data ?? "{}"))

ReactDOM.render(
  <React.StrictMode>
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  </React.StrictMode>,
  document.getElementById("root"),
)

onSnapshot(store, () => {
  localStorage.data = JSON.stringify(store)
})
