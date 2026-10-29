import { useEffect } from 'react'
import { Pencil, Repeat, Trash2 } from 'lucide-react'
import { listMsg, useApp } from '../ctx'
import { clearDay, coverAt, dishOf, slotName } from '../logic'
import type { DayRef } from '../types'
import { DAY_SHORT } from '../weeks'

/** Long-press a day: an iOS action sheet with Edit dish · Change dish · Clear day */
export function CellMenu({ at, onClose, onChange }: { at: DayRef; onClose: () => void; onChange: () => void }) {
  const { state, today, withUndo, openDish } = useApp()
  const cover = coverAt(state, at)
  const dish = cover ? dishOf(state, cover.slot) : undefined

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const title = cover ? `${DAY_SHORT[at.idx]} · ${slotName(state, cover.slot)}${cover.offset ? ' (leftovers)' : ''}` : DAY_SHORT[at.idx]
  const row = 'flex h-[57px] w-full items-center justify-center gap-2 border-t border-sep text-[20px]'

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[430px]">
      <div className="anim-fade absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="anim-sheet absolute inset-x-2 bottom-2 space-y-2" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="overflow-hidden rounded-[14px] bg-white/95 backdrop-blur-xl">
          <div className="px-4 py-3.5 text-center text-[13px] font-semibold text-label2">{title}</div>
          {dish && cover && (
            <button
              className={`${row} text-accent-ink`}
              onClick={() => {
                onClose()
                openDish(dish.id, cover.start)
              }}
            >
              <Pencil size={20} /> Edit dish
            </button>
          )}
          <button className={`${row} text-accent-ink`} onClick={onChange}>
            <Repeat size={20} /> {cover ? 'Change dish' : 'Pick a dish'}
          </button>
          {cover && (
            <button
              className={`${row} text-danger`}
              onClick={() => {
                const name = slotName(state, cover.slot)
                withUndo(
                  (s) => clearDay(s, at, today),
                  (removed) => `${name} cleared${removed ? ` · ${listMsg(0, removed)}` : ''}`,
                )
                onClose()
              }}
            >
              <Trash2 size={20} /> Clear day
            </button>
          )}
        </div>
        <button onClick={onClose} className="h-[57px] w-full rounded-[14px] bg-white text-[20px] font-semibold text-accent-ink">
          Cancel
        </button>
      </div>
    </div>
  )
}
