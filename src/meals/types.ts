export interface Dish {
  id: string
  name: string
  /** Other spellings ("Gnocci" counts as "Gnocchi") */
  aliases: string[]
  weekend: boolean
  /** Default days in a row (1–7) */
  days: number
  /** null = not asked yet, [] = known, nothing to buy */
  ingredients: string[] | null
  /** One step per line, optional */
  prep: string
}

/**
 * The first day of a dish on the plan. Leftover days are not stored: a day is a leftover
 * when an earlier slot's span still covers it.
 */
export interface Slot {
  /** Missing when the dish was deleted — the day then keeps its name as plain text */
  dishId?: string
  name: string
  /** Days in a row for this occurrence */
  span: number
  /** The buy checkbox */
  buy: boolean
}

export interface Item {
  id: string
  text: string
  /** Ticked off while shopping */
  done?: boolean
}

export type ListName = 'main' | 'always' | 'ifEmpty'

export interface State {
  version: 1
  /** ISO week key ("2026-W44") → 7 days, Monday first */
  weeks: Record<string, (Slot | null)[]>
  dishes: Dish[]
  main: Item[]
  always: Item[]
  ifEmpty: Item[]
  /** Day ref ("2026-W44#4") → the main-list items (normalized) that this tick added */
  tickAdds: Record<string, string[]>
}

export interface DayRef {
  key: string
  idx: number
}
