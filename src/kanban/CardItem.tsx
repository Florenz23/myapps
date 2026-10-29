import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon } from './icons'
import type { Card } from './types'

const cardClass =
  'card-touch flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-white/70 bg-gradient-to-b from-slate-50 to-slate-200 px-4 py-3 text-left text-[16px] text-slate-800 shadow-md shadow-black/20'

export function CardFace({ card, lifted }: { card: Card; lifted?: boolean }) {
  return (
    <div className={`${cardClass} ${lifted ? 'scale-[1.04] rotate-1 shadow-2xl shadow-black/40' : ''}`}>
      <Icon name={card.icon} className="size-[18px] shrink-0 text-slate-600" />
      <span className="flex-1 leading-snug">{card.title}</span>
    </div>
  )
}

type Props = { card: Card; listId: string; onOpen: () => void }

// Long-press to pick up (see the sensors in Board.tsx), tap to open.
export function CardItem({ card, listId, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { listId },
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpen}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${cardClass} transition-transform active:scale-[0.98] ${isDragging ? 'opacity-30' : ''}`}
    >
      <Icon name={card.icon} className="size-[18px] shrink-0 text-slate-600" />
      <span className="flex-1 leading-snug">{card.title}</span>
    </button>
  )
}
