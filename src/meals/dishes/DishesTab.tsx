import { useRef, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { listMsg, useApp } from '../ctx'
import { deleteDish, dishStats, norm } from '../logic'
import type { Dish } from '../types'
import { Segmented } from '../ui/controls'

type Filter = 'all' | 'weekday' | 'weekend'

/** All dishes: how often eaten, other spellings, weekday or weekend. Tap to edit, swipe left to delete. */
export function DishesTab() {
  const { state, openDish } = useApp()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [swiped, setSwiped] = useState<string | null>(null)
  const stats = dishStats(state)
  const query = norm(q)

  const shown = state.dishes
    .filter((d) => filter === 'all' || d.weekend === (filter === 'weekend'))
    .filter((d) => !query || [d.name, ...d.aliases].some((n) => norm(n).includes(query)))
    .sort((a, b) => stats.get(b.id)!.total - stats.get(a.id)!.total || a.name.localeCompare(b.name))

  return (
    <div className="px-4">
      <h1 className="px-1 pt-10 pb-2 text-[34px] leading-tight font-bold tracking-tight">Dishes</h1>
      <div className="space-y-2.5 pb-4">
        <label className="flex h-10 items-center gap-2 rounded-[10px] bg-fill px-2.5 text-label2">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-black outline-none placeholder:text-label2"
          />
        </label>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'weekday', label: 'Weekday' },
            { value: 'weekend', label: 'Weekend' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-[12px] bg-card">
        {shown.map((d) => (
          <DishRow
            key={d.id}
            dish={d}
            count={stats.get(d.id)!.total}
            open={swiped === d.id}
            onSwipe={(open) => setSwiped(open ? d.id : null)}
            onTap={() => (swiped ? setSwiped(null) : openDish(d.id))}
          />
        ))}
        {!shown.length && <div className="px-4 py-3 text-[15px] text-label2">No dishes</div>}
      </div>
      <p className="px-4 pt-2 text-[13px] text-label2">New dishes come from the plan: type one in the picker.</p>

    </div>
  )
}

const DELETE_W = 88

function DishRow({ dish, count, open, onSwipe, onTap }: {
  dish: Dish
  count: number
  open: boolean
  onSwipe: (open: boolean) => void
  onTap: () => void
}) {
  const { today, withUndo } = useApp()
  const [dx, setDx] = useState<number | null>(null)
  const start = useRef<{ x: number; y: number; horizontal?: boolean } | null>(null)
  const offset = dx ?? (open ? -DELETE_W : 0)

  return (
    <div className="relative overflow-hidden border-b border-sep last:border-b-0">
      {offset < 0 && <button
        aria-label={`Delete ${dish.name}`}
        onClick={() => {
          onSwipe(false)
          withUndo((s) => deleteDish(s, dish.id, today), (removed) => `${dish.name} deleted${removed ? ` · ${listMsg(0, removed)}` : ''}`)
        }}
        className="absolute inset-y-0 right-0 bg-danger text-[17px] text-white"
        style={{ width: DELETE_W }}
      >
        Delete
      </button>}
      <div
        role="button"
        tabIndex={0}
        onClick={onTap}
        onKeyDown={(e) => e.key === 'Enter' && onTap()}
        onTouchStart={(e) => (start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchMove={(e) => {
          const s = start.current
          if (!s) return
          const mx = e.touches[0].clientX - s.x
          const my = e.touches[0].clientY - s.y
          if (s.horizontal === undefined && Math.hypot(mx, my) > 8) s.horizontal = Math.abs(mx) > Math.abs(my)
          if (s.horizontal) setDx(Math.min(0, Math.max(-DELETE_W * 1.4, mx + (open ? -DELETE_W : 0))))
        }}
        onTouchEnd={() => {
          if (dx !== null) onSwipe(dx < -DELETE_W / 2)
          setDx(null)
          start.current = null
        }}
        className="no-callout relative flex min-h-[60px] cursor-pointer items-center gap-3 bg-card py-2 pr-3 pl-4"
        style={{ transform: `translateX(${offset}px)`, transition: dx === null ? 'transform 0.25s ease' : 'none' }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[17px]">{dish.name}</span>
            {dish.weekend && <span className="shrink-0 rounded-[6px] bg-tint px-1.5 py-0.5 text-[12px] font-medium text-accent-ink">Weekend</span>}
          </div>
          {dish.aliases.length > 0 && <div className="truncate text-[13px] text-label2">{dish.aliases.join(', ')}</div>}
        </div>
        <span className="shrink-0 text-[17px] text-label2 tabular-nums">{count}×</span>
        <ChevronRight size={18} className="shrink-0 text-label3" />
      </div>
    </div>
  )
}
