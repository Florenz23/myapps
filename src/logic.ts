import type { DayRef, Dish, Item, ListName, Slot, State } from './types'
import { parseRef, refId, shiftDay, shiftWeek, todayRef } from './weeks'

// Every function here mutates the state it is given — the caller passes a fresh copy.
// The rules between the plan and the main list (spec §2) are numbered in the comments.

export const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
export const newId = () => Math.random().toString(36).slice(2, 10)

const isPast = (key: string, today: DayRef) => key < today.key

// ── Plan ──────────────────────────────────────────────────────────────────────

export function ensureWeek(s: State, key: string) {
  if (!s.weeks[key]) s.weeks[key] = Array(7).fill(null)
}

/** The current week and the next 3 always exist. Past weeks' ticks stop holding items (rule 6). */
export function housekeeping(s: State, today: DayRef) {
  for (let i = 0; i < 4; i++) ensureWeek(s, shiftWeek(today.key, i))
  for (const id of Object.keys(s.tickAdds)) {
    if (isPast(parseRef(id).key, today)) delete s.tickAdds[id]
  }
}

export function slotAt(s: State, r: DayRef): Slot | null {
  return s.weeks[r.key]?.[r.idx] ?? null
}

export interface Cover {
  start: DayRef
  slot: Slot
  /** 0 = the dish's first day, 1+ = leftovers */
  offset: number
}

/** What is on this day: the dish that starts here, or the run it is a leftover of. */
export function coverAt(s: State, r: DayRef): Cover | null {
  for (let back = 0; back < 7; back++) {
    const start = back === 0 ? r : shiftDay(r, -back)
    const slot = slotAt(s, start)
    if (slot) return slot.span > back ? { start, slot, offset: back } : null
  }
  return null
}

export function dishOf(s: State, slot: Slot | null): Dish | undefined {
  return slot?.dishId ? s.dishes.find((d) => d.id === slot.dishId) : undefined
}

export const slotName = (s: State, slot: Slot) => dishOf(s, slot)?.name ?? slot.name

/** Removes a dish's first day (unticking it first, rule 7). Its leftovers go with it. */
function removeStart(s: State, r: DayRef, today: DayRef): number {
  const slot = slotAt(s, r)
  if (!slot) return 0
  const removed = slot.buy ? untick(s, r, today) : 0
  s.weeks[r.key][r.idx] = null
  return removed
}

/** Days r+1 … r+span-1 become leftovers: dishes that started there are overwritten. */
function claimRun(s: State, r: DayRef, span: number, today: DayRef): number {
  let removed = 0
  for (let i = 1; i < span; i++) {
    const d = shiftDay(r, i)
    ensureWeek(s, d.key) // crossing into a missing week creates it
    removed += removeStart(s, d, today)
  }
  return removed
}

/** Puts a dish on a day. A leftover day splits the earlier run. Returns items removed by unticks. */
export function placeDish(s: State, r: DayRef, dishId: string, today: DayRef, span?: number): number {
  const dish = s.dishes.find((d) => d.id === dishId)!
  ensureWeek(s, r.key)
  let removed = 0
  const cover = coverAt(s, r)
  if (cover && cover.offset > 0) cover.slot.span = cover.offset // the earlier dish ends the day before
  removed += removeStart(s, r, today)
  const days = span ?? dish.days
  removed += claimRun(s, r, days, today)
  s.weeks[r.key][r.idx] = { dishId, name: dish.name, span: days, buy: false }
  return removed
}

/** Clears a day: a first day goes with its leftovers, a leftover day shortens its run. */
export function clearDay(s: State, r: DayRef, today: DayRef): number {
  const cover = coverAt(s, r)
  if (!cover) return 0
  if (cover.offset > 0) {
    cover.slot.span = cover.offset
    return 0
  }
  return removeStart(s, r, today)
}

/** Days in a row for this occurrence: more days overwrite the following ones, fewer give them back. */
export function setSpan(s: State, r: DayRef, span: number, today: DayRef): number {
  const slot = slotAt(s, r)
  if (!slot) return 0
  const removed = claimRun(s, r, span, today)
  slot.span = span
  return removed
}

// ── Dishes ────────────────────────────────────────────────────────────────────

export function findDish(s: State, name: string): Dish | undefined {
  const n = norm(name)
  return s.dishes.find((d) => norm(d.name) === n || d.aliases.some((a) => norm(a) === n))
}

export function createDish(s: State, name: string, weekend: boolean): Dish {
  const dish: Dish = { id: newId(), name: name.trim(), aliases: [], weekend, days: 1, ingredients: null, prep: '' }
  s.dishes.push(dish)
  return dish
}

export interface DishStats {
  total: number
  perWeekday: number[]
}

/** How often each dish is on the plan, counting every spelling and plain-text days. */
export function dishStats(s: State): Map<string, DishStats> {
  const stats = new Map<string, DishStats>()
  for (const d of s.dishes) stats.set(d.id, { total: 0, perWeekday: Array(7).fill(0) })
  for (const days of Object.values(s.weeks)) {
    days.forEach((slot, idx) => {
      if (!slot) return
      const dish = dishOf(s, slot) ?? findDish(s, slot.name)
      if (!dish) return
      const st = stats.get(dish.id)!
      st.total++
      st.perWeekday[idx]++
    })
  }
  return stats
}

export interface DishPatch {
  name: string
  aliases: string[]
  weekend: boolean
  days: number
  ingredients: string[] | null
  prep: string
}

/** Saves a dish. A rename keeps the old name as another spelling. Ingredient changes follow rule 8. */
export function updateDish(s: State, id: string, patch: DishPatch, today: DayRef): { added: number; removed: number } {
  const dish = s.dishes.find((d) => d.id === id)!
  const name = patch.name.trim() || dish.name
  const aliases = cleanList(patch.aliases)
  if (norm(name) !== norm(dish.name) && !aliases.some((a) => norm(a) === norm(dish.name))) aliases.push(dish.name)
  const before = dish.ingredients ?? []
  Object.assign(dish, {
    ...patch,
    name,
    aliases: aliases.filter((a) => norm(a) !== norm(name)),
    days: clampDays(patch.days),
    ingredients: patch.ingredients === null ? null : cleanList(patch.ingredients),
  })
  const after = dish.ingredients ?? []
  const gone = before.map(norm).filter((n) => !after.some((a) => norm(a) === n))
  const fresh = after.filter((a) => !before.some((b) => norm(b) === norm(a)))

  const ticked = activeTicks(s, today).filter((t) => t.dish.id === id)
  let removed = 0
  for (const n of gone) {
    for (const t of ticked) {
      const own = s.tickAdds[t.id]
      if (!own?.includes(n)) continue
      s.tickAdds[t.id] = own.filter((x) => x !== n)
      removed += release(s, n, t.id, today)
    }
  }
  let added = 0
  if (ticked.length) {
    for (const ing of fresh) if (addTracked(s, ing, ticked[0].id)) added++
  }
  return { added, removed }
}

/** Deletes a dish. Its days keep the name as plain text; ticked ones are unticked first. */
export function deleteDish(s: State, id: string, today: DayRef): number {
  let removed = 0
  for (const [key, days] of Object.entries(s.weeks)) {
    days.forEach((slot, idx) => {
      if (slot?.dishId !== id) return
      if (slot.buy) removed += untick(s, { key, idx }, today)
      days[idx] = { name: slotName(s, slot), span: slot.span, buy: false }
    })
  }
  s.dishes = s.dishes.filter((d) => d.id !== id)
  return removed
}

export const clampDays = (n: number) => Math.min(7, Math.max(1, Math.round(n) || 1))

export function cleanList(xs: string[]): string[] {
  const out: string[] = []
  for (const x of xs) {
    const t = capitalize(x)
    if (t && !out.some((o) => norm(o) === norm(t))) out.push(t)
  }
  return out
}

/** "dough" → "Dough": typed items read like a list, whatever the keyboard did */
export function capitalize(x: string): string {
  const t = x.trim().replace(/\s+/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const splitList = (text: string) => cleanList(text.split(','))

// ── Ticks and the main list (rules 1–10) ─────────────────────────────────────

interface ActiveTick {
  id: string
  dish: Dish
}

/** Ticked first days in the current or future weeks. Past weeks hold nothing (rule 6). */
function activeTicks(s: State, today: DayRef): ActiveTick[] {
  const out: ActiveTick[] = []
  for (const key of Object.keys(s.weeks).sort()) {
    if (isPast(key, today)) continue
    s.weeks[key].forEach((slot, idx) => {
      const dish = dishOf(s, slot)
      if (slot?.buy && dish) out.push({ id: refId({ key, idx }), dish })
    })
  }
  return out
}

const onMain = (s: State, n: string) => s.main.some((i) => norm(i.text) === n)

function addTracked(s: State, text: string, tickId: string): boolean {
  const n = norm(text)
  if (onMain(s, n)) return false
  s.main.push({ id: newId(), text: capitalize(text) })
  ;(s.tickAdds[tickId] ??= []).push(n)
  return true
}

/**
 * An item a tick added is no longer needed by that tick: another ticked day that still needs
 * it takes it over, otherwise it leaves the main list. Returns 1 when it was removed.
 */
function release(s: State, n: string, fromId: string, today: DayRef): number {
  if (!onMain(s, n)) return 0
  const heir = activeTicks(s, today).find(
    (t) => t.id !== fromId && (t.dish.ingredients ?? []).some((i) => norm(i) === n),
  )
  if (heir) {
    ;(s.tickAdds[heir.id] ??= []).push(n)
    return 0
  }
  s.main = s.main.filter((i) => norm(i.text) !== n)
  return 1
}

/** Rule 2: adds the dish's ingredients that are not on the list yet, and remembers them. */
export function tick(s: State, r: DayRef, today: DayRef): number {
  const slot = slotAt(s, r)
  const dish = dishOf(s, slot)
  if (!slot || !dish || dish.ingredients === null) return 0
  slot.buy = true
  if (isPast(r.key, today)) return 0
  let added = 0
  for (const ing of dish.ingredients) if (addTracked(s, ing, refId(r))) added++
  return added
}

/** Rule 3: removes only what ticks added, and only if no other ticked day still needs it. */
export function untick(s: State, r: DayRef, today: DayRef): number {
  const slot = slotAt(s, r)
  if (!slot) return 0
  slot.buy = false
  const id = refId(r)
  const own = s.tickAdds[id] ?? []
  delete s.tickAdds[id]
  if (isPast(r.key, today)) return 0
  let removed = 0
  for (const n of own) removed += release(s, n, id, today)
  return removed
}

/** The cart button: ticks every unticked first day of the week. Dishes not asked yet come back to ask. */
export function tickWeek(s: State, key: string, today: DayRef): { added: number; ask: DayRef[] } {
  let added = 0
  const ask: DayRef[] = []
  s.weeks[key]?.forEach((slot, idx) => {
    const dish = dishOf(s, slot)
    if (!slot || slot.buy || !dish) return
    if (dish.ingredients === null) ask.push({ key, idx })
    else added += tick(s, { key, idx }, today)
  })
  return { added, ask }
}

/** Rule 4: an item deleted, edited or ticked off by hand is yours — no tick removes it any more. */
function makeYours(s: State, text: string) {
  const n = norm(text)
  for (const id of Object.keys(s.tickAdds)) s.tickAdds[id] = s.tickAdds[id].filter((x) => x !== n)
}

/** Adds an item to the main list unless it is already there. */
export function addToMain(s: State, text: string): boolean {
  const t = capitalize(text)
  if (!t || onMain(s, norm(t))) return false
  s.main.push({ id: newId(), text: t })
  return true
}

export function addToList(s: State, list: ListName, text: string): boolean {
  if (list === 'main') return addToMain(s, text)
  const t = capitalize(text)
  if (!t || s[list].some((i) => norm(i.text) === norm(t))) return false
  s[list].push({ id: newId(), text: t })
  return true
}

export function deleteItem(s: State, list: ListName, id: string) {
  const item = s[list].find((i) => i.id === id)
  if (!item) return
  if (list === 'main') makeYours(s, item.text)
  s[list] = s[list].filter((i) => i.id !== id)
}

export function editItem(s: State, list: ListName, id: string, text: string) {
  const item = s[list].find((i) => i.id === id)
  if (!item || item.text === text.trim()) return
  if (list === 'main') makeYours(s, item.text)
  const t = text.trim()
  const dup = s[list].some((i) => i.id !== id && norm(i.text) === norm(t))
  if (!t || dup) s[list] = s[list].filter((i) => i.id !== id)
  else item.text = t
}

export function toggleDone(s: State, id: string) {
  const item = s.main.find((i) => i.id === id)
  if (!item) return
  makeYours(s, item.text)
  item.done = !item.done
}

export function clearMain(s: State, onlyDone: boolean) {
  for (const i of s.main) if (!onlyDone || i.done) makeYours(s, i.text)
  s.main = onlyDone ? s.main.filter((i) => !i.done) : []
}

export function moveToMain(s: State, list: ListName, ids: string[]): number {
  let n = 0
  for (const item of s[list]) if (ids.includes(item.id) && addToMain(s, item.text)) n++
  return n
}

export function reorder(s: State, list: ListName, from: string, to: string) {
  const items: Item[] = s[list]
  const a = items.findIndex((i) => i.id === from)
  const b = items.findIndex((i) => i.id === to)
  if (a < 0 || b < 0) return
  const [moved] = items.splice(a, 1)
  items.splice(b, 0, moved)
}

export function emptyState(): State {
  return { version: 1, weeks: {}, dishes: [], main: [], always: [], ifEmpty: [], tickAdds: {} }
}

export { todayRef }
