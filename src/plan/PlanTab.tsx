import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import { useApp } from '../ctx'
import { ensureWeek, tickWeek } from '../logic'
import type { DayRef } from '../types'
import { shiftWeek, weekNumber, weekRange, weekYear } from '../weeks'
import { DayRow } from './DayRow'
import { PickerSheet } from './PickerSheet'
import { CellMenu } from './CellMenu'

/** One week at a time, the 7 days stacked. Swipe or arrows change the week. */
export function PlanTab() {
  const { state, today, update, askIngredients } = useApp()
  const [viewKey, setViewKey] = useState(today.key)
  const [picker, setPicker] = useState<DayRef | null>(null)
  const [menu, setMenu] = useState<DayRef | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const keys = Object.keys(state.weeks).sort()
  const prev = keys.filter((k) => k < viewKey).at(-1)
  const next = keys.find((k) => k > viewKey)
  const days = state.weeks[viewKey] ?? Array(7).fill(null)
  const isPast = viewKey < today.key

  const addWeek = () => {
    const key = shiftWeek(keys.at(-1)!, 1)
    update((s) => ensureWeek(s, key))
    setViewKey(key)
  }

  const shopWeek = () => {
    const r = update((s) => tickWeek(s, viewKey, today))
    askIngredients(r.ask, r.added)
  }

  return (
    <div
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const t = touch.current
        touch.current = null
        if (!t || picker || menu) return
        const dx = e.changedTouches[0].clientX - t.x
        const dy = e.changedTouches[0].clientY - t.y
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
        if (dx < 0 && next) setViewKey(next)
        if (dx > 0 && prev) setViewKey(prev)
      }}
    >
      <header className="flex items-center justify-between px-2 pt-3">
        <button
          aria-label="Previous week"
          disabled={!prev}
          onClick={() => prev && setViewKey(prev)}
          className="flex h-11 w-11 items-center justify-center text-label2 disabled:opacity-30"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="text-center">
          <h1 className="text-[30px] leading-tight font-bold tracking-tight">Week {weekNumber(viewKey)}</h1>
          <div className="text-[15px] text-label2">
            {weekRange(viewKey)}
            {weekYear(viewKey) !== weekYear(today.key) && ` · ${weekYear(viewKey)}`}
          </div>
        </div>
        {next ? (
          <button
            aria-label="Next week"
            onClick={() => setViewKey(next)}
            className="flex h-11 w-11 items-center justify-center text-label2"
          >
            <ChevronRight size={28} />
          </button>
        ) : (
          <button aria-label="Add week" onClick={addWeek} className="flex h-11 w-11 items-center justify-center text-accent-ink">
            <Plus size={26} />
          </button>
        )}
      </header>

      <div className="flex h-11 items-center justify-between px-4">
        {viewKey !== today.key ? (
          <button onClick={() => setViewKey(today.key)} className="h-11 text-[15px] font-medium text-accent-ink">
            {isPast ? 'Past week · back to today' : 'Back to this week'}
          </button>
        ) : (
          <span className="text-[15px] text-label2">This week</span>
        )}
        <button onClick={shopWeek} className="flex h-11 items-center gap-1.5 text-[15px] font-medium text-accent-ink">
          <ShoppingCart size={18} />
          Week to list
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {days.map((_, idx) => (
          <DayRow
            key={`${viewKey}#${idx}`}
            at={{ key: viewKey, idx }}
            onTap={() => setPicker({ key: viewKey, idx })}
            onLongPress={() => setMenu({ key: viewKey, idx })}
          />
        ))}
      </div>

      {!next && (
        <button onClick={addWeek} className="mx-auto mt-3 flex h-11 items-center gap-1.5 px-4 text-[15px] font-medium text-accent-ink">
          <Plus size={18} /> Add week
        </button>
      )}

      {picker && <PickerSheet at={picker} onClose={() => setPicker(null)} />}
      {menu && (
        <CellMenu
          at={menu}
          onClose={() => setMenu(null)}
          onChange={() => {
            setMenu(null)
            setPicker(menu)
          }}
        />
      )}
    </div>
  )
}
