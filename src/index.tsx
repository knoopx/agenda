import React from "react"
import { createRoot } from "react-dom/client"

import "./index.css"

import { onSnapshot } from "mobx-state-tree"

import App from "./App"
import { Store } from "./models"
import { StoreContext } from "./hooks/useStore"

const store = Store.create(JSON.parse(localStorage.data ?? "{}"))

const root = createRoot(document.getElementById("root")!)
root.render(
  <React.StrictMode>
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  </React.StrictMode>
)

onSnapshot(store, () => {
  localStorage.data = JSON.stringify(store)
})
