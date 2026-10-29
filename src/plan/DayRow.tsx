import { useRef } from 'react'
import { BookOpen } from 'lucide-react'
import { useApp } from '../ctx'
import { coverAt, dishOf, slotName } from '../logic'
import type { DayRef } from '../types'
import { DAY_SHORT } from '../weeks'
import { Checkbox, StatusDot } from '../ui/controls'

/** Tap → picker, long-press (or right-click) → cell menu */
function useLongPress(onLongPress: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)
  const cancel = () => {
    clearTimeout(timer.current)
    start.current = null
  }
  return {
    fired,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return
        fired.current = false
        start.current = { x: e.clientX, y: e.clientY }
        timer.current = window.setTimeout(() => {
          fired.current = true
          navigator.vibrate?.(10)
          onLongPress()
        }, 450)
      },
      onPointerMove: (e: React.PointerEvent) => {
        const s = start.current
        if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 10) cancel()
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault()
        if (!fired.current) onLongPress()
        fired.current = true
      },
    },
  }
}

export function DayRow({ at, onTap, onLongPress }: { at: DayRef; onTap: () => void; onLongPress: () => void }) {
  const { state, today, toggleTick } = useApp()
  const { fired, handlers } = useLongPress(onLongPress)
  const cover = coverAt(state, at)
  const isToday = at.key === today.key && at.idx === today.idx

  let content: React.ReactNode
  if (!cover) {
    content = <span className="text-[17px] text-label2 italic">Tap to pick a dish</span>
  } else if (cover.offset > 0) {
    content = <span className="text-[17px] text-label2 italic">↳ leftovers</span>
  } else {
    const slot = cover.slot
    const dish = dishOf(state, slot)
    const ing = dish?.ingredients
    content = (
      <>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-[17px]">{slotName(state, slot)}</span>
          {slot.span > 1 && (
            <span className="shrink-0 rounded-[6px] bg-fill px-1.5 py-0.5 text-[13px] text-label2">{slot.span} days</span>
          )}
        </div>
        {dish && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2.5">
              <StatusDot ingredients={ing ?? null} />
              <Checkbox checked={slot.buy} onChange={() => toggleTick(at)} label={`Buy for ${dish.name}`} />
            </div>
            <div className="flex items-center gap-1 text-[13px] text-label2">
              {ing === null ? 'ingredients?' : ing!.length ? `${ing!.length} ingr.` : 'no shopping'}
              {dish.prep.trim() && <BookOpen size={14} aria-label="Has preparation steps" />}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      {...handlers}
      onClick={() => {
        if (fired.current) fired.current = false
        else onTap()
      }}
      onKeyDown={(e) => e.key === 'Enter' && onTap()}
      className={`no-callout flex min-h-[68px] cursor-pointer items-stretch rounded-[12px] border transition-colors active:bg-fill/60 ${
        isToday ? 'border-accent/50 bg-tint' : 'border-transparent bg-card'
      }`}
    >
      <div className="flex w-[64px] shrink-0 flex-col items-center justify-center">
        <span className="text-[21px] leading-none font-bold">{DAY_SHORT[at.idx]}</span>
        {isToday && <span className="mt-1 text-[12px] text-label2">today</span>}
      </div>
      <div className={`my-3 w-px ${isToday ? 'bg-accent/30' : 'bg-sep'}`} />
      <div className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-4 pl-3">{content}</div>
    </div>
  )
}
