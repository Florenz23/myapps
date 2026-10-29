import { useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { listMsg, useApp } from '../ctx'
import { clearDay, coverAt, createDish, dishStats, findDish, norm, placeDish } from '../logic'
import type { DayRef, Dish } from '../types'
import { DAY_LONG, DAY_SHORT, weekNumber } from '../weeks'
import { Sheet } from '../ui/Sheet'
import { Segmented } from '../ui/controls'

type Filter = 'weekday' | 'weekend' | 'all'

/** Tap a day → pick a dish. Sorted by how often it was eaten on this weekday, then overall. */
export function PickerSheet({ at, onClose }: { at: DayRef; onClose: () => void }) {
  const { state, today, update, toast } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>(at.idx >= 5 ? 'weekend' : 'weekday')

  const stats = dishStats(state)
  const cover = coverAt(state, at)
  const currentId = cover?.offset === 0 ? cover.slot.dishId : undefined
  const query = norm(q)
  const exact = q.trim() ? findDish(state, q) : undefined

  const shown = state.dishes
    .filter((d) =>
      query
        ? [d.name, ...d.aliases].some((n) => norm(n).includes(query))
        : filter === 'all' || d.weekend === (filter === 'weekend'),
    )
    .sort((a, b) => {
      const sa = stats.get(a.id)!
      const sb = stats.get(b.id)!
      return sb.perWeekday[at.idx] - sa.perWeekday[at.idx] || sb.total - sa.total || a.name.localeCompare(b.name)
    })
  const eatenHere = shown.filter((d) => stats.get(d.id)!.perWeekday[at.idx] > 0)
  const others = shown.filter((d) => stats.get(d.id)!.perWeekday[at.idx] === 0)

  const done = (removed: number) => {
    if (removed) toast(listMsg(0, removed))
    onClose()
  }
  const pick = (dish: Dish) => done(update((s) => placeDish(s, at, dish.id, today)))
  const add = () => {
    const name = q.trim()
    if (!name) return
    if (exact) return pick(exact)
    const weekend = filter === 'weekend' || (filter === 'all' && at.idx >= 5)
    done(update((s) => placeDish(s, at, createDish(s, name, weekend).id, today)))
  }

  const row = (d: Dish) => {
    const st = stats.get(d.id)!
    return (
      <button
        key={d.id}
        onClick={() => pick(d)}
        className="flex min-h-[48px] w-full items-center gap-3 border-b border-sep py-2 pr-4 text-left last:border-b-0"
      >
        <span className="min-w-0 flex-1 truncate text-[17px]">{d.name}</span>
        <span className="shrink-0 text-[14px] text-label2">
          {st.perWeekday[at.idx]}× {DAY_SHORT[at.idx]} · {st.total}
          {d.days > 1 && ` · ${d.days} days`}
        </span>
        {d.id === currentId && <Check size={18} className="shrink-0 text-accent-ink" />}
      </button>
    )
  }

  return (
    <Sheet onClose={onClose} tall>
      <div className="flex items-center justify-between px-4 pb-2">
        <button onClick={onClose} className="h-11 text-[17px] text-accent-ink">Cancel</button>
        <div className="text-center">
          <div className="text-[17px] font-semibold">{DAY_LONG[at.idx]}</div>
          <div className="text-[12px] text-label2">Week {weekNumber(at.key)}</div>
        </div>
        <span className="w-14" />
      </div>

      <div className="space-y-2.5 px-4 pb-3">
        <label className="flex h-10 items-center gap-2 rounded-[10px] bg-fill px-2.5 text-label2">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Search or add a dish"
            enterKeyHint="done"
            className="min-w-0 flex-1 bg-transparent text-black outline-none placeholder:text-label2"
          />
        </label>
        {!query && (
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'weekday', label: 'Weekday' },
              { value: 'weekend', label: 'Weekend' },
              { value: 'all', label: 'All' },
            ]}
          />
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        <div className="overflow-hidden rounded-[12px] bg-card pl-4">
          {q.trim() && !exact && (
            <button onClick={add} className="flex min-h-[48px] w-full items-center gap-2 border-b border-sep pr-4 text-left text-[17px] text-accent-ink last:border-b-0">
              <Plus size={20} /> Add “{q.trim()}”
            </button>
          )}
          {eatenHere.map(row)}
          {others.length > 0 && eatenHere.length > 0 && (
            <div className="border-b border-sep py-1.5 text-[13px] text-label2">other dishes</div>
          )}
          {others.map(row)}
          {!shown.length && !q.trim() && <div className="py-3 pr-4 text-[15px] text-label2">No dishes here yet — type one above</div>}
        </div>

        {cover && (
          <button
            onClick={() => done(update((s) => clearDay(s, at, today)))}
            className="mt-4 h-12 w-full rounded-[12px] bg-card text-[17px] text-danger"
          >
            Clear day
          </button>
        )}
      </div>
    </Sheet>
  )
}
