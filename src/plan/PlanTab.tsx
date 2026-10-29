import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from 'lucide-react'
import { useApp } from '../ctx'
import { ensureWeek, tickWeek } from '../logic'
import type { DayRef } from '../types'
import { mondayOf, shiftWeek, weekNumber, weekRange, weekYear } from '../weeks'
import { DayRow } from './DayRow'
import { PickerSheet } from './PickerSheet'
import { CellMenu } from './CellMenu'

function weekStatus(key: string, current: string): string {
  const diff = Math.round((mondayOf(key).getTime() - mondayOf(current).getTime()) / (7 * 86_400_000))
  if (diff === 0) return 'This week'
  if (diff === 1) return 'Next week'
  if (diff === -1) return 'Last week'
  return diff > 0 ? `In ${diff} weeks` : `${-diff} weeks ago`
}

/** One week at a time, the 7 days stacked. Swipe or arrows change the week. */
export function PlanTab() {
  const { state, today, update, askIngredients } = useApp()
  const [viewKey, setViewKey] = useState(today.key)
  const [picker, setPicker] = useState<DayRef | null>(null)
  const [menu, setMenu] = useState<DayRef | null>(null)
  // The week follows the finger and slides in from the side it came from
  const touch = useRef<{ x: number; y: number; horizontal?: boolean } | null>(null)
  const [dragX, setDragX] = useState<number | null>(null)
  const [slide, setSlide] = useState<'' | 'from-right' | 'from-left'>('')

  const keys = Object.keys(state.weeks).sort()
  const prev = keys.filter((k) => k < viewKey).at(-1)
  const next = keys.find((k) => k > viewKey)
  const days = state.weeks[viewKey] ?? Array(7).fill(null)
  const isPast = viewKey < today.key

  const go = (key: string | undefined, from: 'from-right' | 'from-left') => {
    if (!key || key === viewKey) return
    setSlide(from)
    setViewKey(key)
  }
  const goTo = (key: string) => go(key, key > viewKey ? 'from-right' : 'from-left')

  const addWeek = () => {
    const key = shiftWeek(keys.at(-1)!, 1)
    update((s) => ensureWeek(s, key))
    go(key, 'from-right')
  }

  const shopWeek = () => {
    const r = update((s) => tickWeek(s, viewKey, today))
    askIngredients(r.ask, r.added)
  }

  return (
    <div
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchMove={(e) => {
        const t = touch.current
        if (!t || picker || menu) return
        const dx = e.touches[0].clientX - t.x
        const dy = e.touches[0].clientY - t.y
        if (t.horizontal === undefined && Math.hypot(dx, dy) > 10) t.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2
        if (!t.horizontal) return
        const blocked = (dx < 0 && !next) || (dx > 0 && !prev)
        setDragX(blocked ? dx / 4 : dx)
      }}
      onTouchEnd={(e) => {
        const t = touch.current
        touch.current = null
        setDragX(null)
        if (!t || picker || menu) return
        const dx = e.changedTouches[0].clientX - t.x
        const dy = e.changedTouches[0].clientY - t.y
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return
        if (dx < 0) go(next, 'from-right')
        else go(prev, 'from-left')
      }}
      onTouchCancel={() => {
        touch.current = null
        setDragX(null)
      }}
    >
      <header className="flex items-center justify-between px-2 pt-3">
        <button
          aria-label="Previous week"
          disabled={!prev}
          onClick={() => go(prev, 'from-left')}
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
        <button
          aria-label="Next week"
          disabled={!next}
          onClick={() => go(next, 'from-right')}
          className="flex h-11 w-11 items-center justify-center text-label2 disabled:opacity-30"
        >
          <ChevronRight size={28} />
        </button>
      </header>

      <div className="flex h-11 items-center justify-between px-4">
        <div className="flex items-center gap-3 text-[15px]">
          <span className="text-label2">{weekStatus(viewKey, today.key)}</span>
          {viewKey !== today.key && (
            <button onClick={() => goTo(today.key)} className="h-11 font-medium text-accent-ink">
              Today
            </button>
          )}
        </div>
        {!isPast && (
          <button onClick={shopWeek} className="flex h-11 items-center gap-1.5 text-[15px] font-medium text-accent-ink">
            <ShoppingCart size={18} />
            Week to list
          </button>
        )}
      </div>

      <div
        key={viewKey}
        className={`flex flex-col gap-2 px-4 ${slide ? `anim-${slide}` : ''}`}
        style={dragX !== null ? { transform: `translateX(${dragX}px)` } : { transition: 'transform 0.25s ease' }}
      >
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
