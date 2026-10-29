import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { listMsg, useApp } from '../ctx'
import { clearMain, moveToMain } from '../logic'
import type { ListName } from '../types'
import { ItemList } from './ItemList'

/** Main list on top; Always and If empty below, folded */
export function ShoppingTab() {
  const { state, withUndo } = useApp()
  const doneCount = state.main.filter((i) => i.done).length

  return (
    <div className="px-4">
      <h1 className="px-1 pt-10 pb-2 text-[34px] leading-tight font-bold tracking-tight">Shopping</h1>

      <div className="flex items-end justify-between px-1 pt-2 pb-2">
        <h2 className="text-[22px] font-bold">Main list</h2>
        <div className="flex gap-4">
          {doneCount > 0 && (
            <button
              onClick={() => withUndo((s) => clearMain(s, true), () => `${doneCount} ticked cleared`)}
              className="h-9 text-[17px] text-accent-ink"
            >
              Clear ticked
            </button>
          )}
          {state.main.length > 0 && (
            <button
              onClick={() => withUndo((s) => clearMain(s, false), () => 'Main list cleared')}
              className="h-9 text-[17px] text-accent-ink"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <ItemList list="main" />

      <div className="mt-6">
        <Folded list="always" title="Always" />
        <Folded list="ifEmpty" title="If empty" />
      </div>
    </div>
  )
}

function Folded({ list, title }: { list: Exclude<ListName, 'main'>; title: string }) {
  const { state, update, toast } = useApp()
  const [open, setOpen] = useState(false)
  const items = state[list]

  return (
    <section className="border-t border-sep">
      <div className="flex h-14 items-center justify-between px-1">
        <button onClick={() => setOpen(!open)} className="flex h-12 items-center gap-1.5 text-[22px] font-semibold" aria-expanded={open}>
          {title} ({items.length})
          <ChevronDown size={20} strokeWidth={2.5} className={`text-label2 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {items.length > 0 && (
          <button
            onClick={() => {
              const n = update((s) => moveToMain(s, list, items.map((i) => i.id)))
              toast(n ? listMsg(n, 0) : 'All already on the main list')
            }}
            className="flex h-11 items-center gap-1 text-[17px] text-accent-ink"
          >
            All <ArrowRight size={18} />
          </button>
        )}
      </div>
      {open && (
        <div className="pb-4">
          <ItemList list={list} />
        </div>
      )}
    </section>
  )
}
