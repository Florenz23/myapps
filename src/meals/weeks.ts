import type { DayRef } from './types'

// Weeks are keyed by ISO year + week ("2026-W44"), so January works.
// All date math runs in UTC on midnight dates, so daylight saving never shifts a day.

const DAY_MS = 86_400_000

function keyOfUTC(d: Date): string {
  const t = new Date(d)
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day) // the Thursday of this week decides the year
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

function toUTC(local: Date): Date {
  return new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()))
}

export function todayRef(now = new Date()): DayRef {
  const d = toUTC(now)
  return { key: keyOfUTC(d), idx: (d.getUTCDay() + 6) % 7 }
}

export function mondayOf(key: string): Date {
  const [y, w] = key.split('-W').map(Number)
  const jan4 = new Date(Date.UTC(y, 0, 4))
  const mon = new Date(jan4)
  mon.setUTCDate(jan4.getUTCDate() - (jan4.getUTCDay() || 7) + 1 + (w - 1) * 7)
  return mon
}

export function shiftDay(ref: DayRef, n: number): DayRef {
  const d = mondayOf(ref.key)
  d.setUTCDate(d.getUTCDate() + ref.idx + n)
  return { key: keyOfUTC(d), idx: (d.getUTCDay() + 6) % 7 }
}

export function shiftWeek(key: string, n: number): string {
  return shiftDay({ key, idx: 0 }, n * 7).key
}

export const refId = (r: DayRef) => `${r.key}#${r.idx}`

export function parseRef(id: string): DayRef {
  const [key, idx] = id.split('#')
  return { key, idx: Number(idx) }
}

export const weekNumber = (key: string) => Number(key.split('-W')[1])
export const weekYear = (key: string) => Number(key.split('-W')[0])

export function weekRange(key: string): string {
  const mon = mondayOf(key)
  const sun = new Date(mon.getTime() + 6 * DAY_MS)
  const f = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return `${f(mon)} – ${f(sun)}`
}

export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
