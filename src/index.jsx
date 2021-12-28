import React from "react"
import ReactDOM from "react-dom"

import "./index.css"

import { onSnapshot } from "mobx-state-tree"

import App from "./App"
import Store, { Context } from "./store"

const store = Store.create(JSON.parse(localStorage.data ?? "{}"))

ReactDOM.render(
  <React.StrictMode>
    <Context.Provider value={store}>
      <App />
    </Context.Provider>
  </React.StrictMode>,
  document.getElementById("root"),
)

onSnapshot(store, () => {
  localStorage.data = JSON.stringify(store)
})
