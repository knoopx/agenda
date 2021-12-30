import {  createContext, useContext } from "react"
import { IStore } from "../models"

export const StoreContext = createContext<IStore | null>(null)

export function useStore() {
  return useContext(StoreContext)!
}