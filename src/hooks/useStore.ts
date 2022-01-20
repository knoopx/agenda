import {  createContext, useContext } from "react"
import { IStore } from "../models"

export const StoreContext = createContext<IStore | null>(null)

export function useStore() : IStore {
  return useContext(StoreContext)!
}