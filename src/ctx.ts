import { createContext, useContext } from 'react'
import type { DayRef, State } from './types'

export interface AppCtx {
  state: State
  today: DayRef
  update: <R>(fn: (s: State) => R) => R
  /** Runs a change and shows a toast with Undo, which brings back the state from before */
  withUndo: <R>(fn: (s: State) => R, text: (result: R) => string) => R
  toast: (text: string) => void
  /** The buy checkbox: ticks (asking for ingredients when needed) or unticks */
  toggleTick: (r: DayRef) => void
  /** Asks "which ingredients?" for these days, one after another, and ticks each one saved */
  askIngredients: (refs: DayRef[], addedBefore?: number) => void
  openDish: (dishId: string, occurrence?: DayRef) => void
}

export const Ctx = createContext<AppCtx>(null!)
export const useApp = () => useContext(Ctx)

/** The toast after a tick (rule 10) */
export function listMsg(added: number, removed: number): string {
  if (added && removed) return `+${added} −${removed} on the main list`
  if (added) return `+${added} on the main list`
  if (removed) return `−${removed} from the main list`
  return 'main list unchanged'
}
