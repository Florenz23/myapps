import { X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useKeyboardInset } from './useKeyboardInset'

type Props = {
  title?: ReactNode
  onClose: () => void
  children: ReactNode
}

const ANIMATION_MS = 300

// Full-width panel that slides up from the bottom, stays above the keyboard,
// and closes like an iOS sheet: swipe it down, tap outside, or the X.
export function Sheet({ title, onClose, children }: Props) {
  const [shown, setShown] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ y: number; t: number; id: number } | null>(null)
  const keyboard = useKeyboardInset()

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const close = () => {
    setDragging(false)
    setShown(false)
    setTimeout(onClose, ANIMATION_MS)
  }

  // Swipe down: the sheet follows the finger. Text fields keep their own touch behaviour.
  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea')) return
    start.current = { y: e.clientY, t: performance.now(), id: e.pointerId }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const dy = e.clientY - start.current.y
    if (!dragging) {
      if (dy < 8) return
      // From here it's a swipe, not a tap on a button inside the sheet.
      e.currentTarget.setPointerCapture(start.current.id)
      setDragging(true)
    }
    setDragY(Math.max(0, dy))
  }

  const onPointerUp = (e: PointerEvent) => {
    const s = start.current
    start.current = null
    if (!s || !dragging) return
    const dy = e.clientY - s.y
    const speed = dy / (performance.now() - s.t) // px per ms
    if (dy > 120 || speed > 0.6) close()
    else {
      setDragging(false)
      setDragY(0)
    }
  }

  const offset = shown ? `${dragY}px` : '100%'

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={close}
        style={{ opacity: shown ? Math.max(0, 1 - dragY / 400) : 0 }}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${dragging ? '' : 'transition-opacity duration-300'}`}
      />
      <div
        role="dialog"
        aria-modal
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ bottom: keyboard, transform: `translateY(${offset})` }}
        className={`sheet-swipe absolute inset-x-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-white/20 bg-[#1b2c5e]/95 px-5 pt-2 shadow-2xl backdrop-blur-xl ${
          dragging ? '' : 'transition-transform duration-300 ease-out'
        } ${keyboard ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'}`}
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-white/30" />
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 text-[17px] font-semibold text-white">{title}</div>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="grid size-11 place-items-center rounded-full text-white/80 active:bg-white/15"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
