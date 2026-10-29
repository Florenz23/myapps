import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { List } from './types'

type Props = {
  lists: List[]
  active: number
  onPick: (index: number) => void
  onAddList: () => void
}

// The row of pills on top: where am I, and one tap to jump to another list.
export function ListSwitcher({ lists, active, onPick, onAddList }: Props) {
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pill = row.current?.children[active] as HTMLElement | undefined
    pill?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  return (
    <nav ref={row} className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
      {lists.map((list, i) => (
        <Pill key={list.id} list={list} isActive={i === active} onPick={() => onPick(i)} />
      ))}
      <button
        type="button"
        aria-label="New list"
        onClick={onAddList}
        className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80"
      >
        <Plus className="size-5" />
      </button>
    </nav>
  )
}

// Each pill is also a drop target: drag a card onto it to move the card to that list.
function Pill({ list, isActive, onPick }: { list: List; isActive: boolean; onPick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `pill:${list.id}`, data: { listId: list.id } })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onPick}
      aria-current={isActive}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold uppercase tracking-wide transition-all ${
        isOver
          ? 'scale-110 border-white bg-white/40 text-white'
          : isActive
            ? 'border-white/40 bg-white/25 text-white'
            : 'border-white/10 bg-white/5 text-white/65'
      }`}
    >
      <span className="size-2.5 rounded-full" style={{ background: list.accent }} />
      {list.title}
      <span className="text-[13px] font-medium text-white/50">{list.cards.length}</span>
    </button>
  )
}
