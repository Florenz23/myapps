import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Ellipsis, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CardItem } from './CardItem'
import { Icon } from './icons'
import type { Card, List } from './types'

type Props = {
  list: List
  onOpenCard: (card: Card) => void
  onAddCard: (title: string) => void
  onRename: (title: string) => void
  onOpenMenu: () => void
}

export function ListColumn({ list, onOpenCard, onAddCard, onRename, onOpenMenu }: Props) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(list.title)
  const cardsEnd = useRef<HTMLDivElement>(null)

  // Keep the newest card and the text field in view while adding several in a row.
  useEffect(() => {
    if (adding) cardsEnd.current?.scrollIntoView({ block: 'end' })
  }, [adding, list.cards.length])

  const addCard = () => {
    if (draft.trim()) onAddCard(draft.trim())
    setDraft('')
  }

  const finishRename = (save: boolean) => {
    if (save && name.trim()) onRename(name.trim())
    else setName(list.title)
    setRenaming(false)
  }

  return (
    <section
      className="flex max-h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-xl shadow-black/30 backdrop-blur-xl"
      style={{ borderTop: `3px solid ${list.accent}` }}
    >
      <header className="flex items-center gap-2 pl-3 pr-2 pt-2 pb-1">
        {renaming ? (
          <input
            autoFocus
            value={name}
            aria-label="List name"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => finishRename(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishRename(true)
              if (e.key === 'Escape') finishRename(false)
            }}
            className="h-11 min-w-0 flex-1 rounded-lg border border-sky-400 bg-white/10 px-2 text-[20px] font-bold uppercase tracking-wide text-white outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setName(list.title)
              setRenaming(true)
            }}
            className="h-11 min-w-0 flex-1 truncate px-2 text-left text-[20px] font-bold uppercase tracking-wide text-white"
          >
            {list.title}
          </button>
        )}
        <span style={{ color: list.accent }}>
          <Icon name={list.icon} className="size-5" />
        </span>
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={`Actions for ${list.title}`}
          className="grid size-11 place-items-center rounded-full text-white/80 active:bg-white/15"
        >
          <Ellipsis className="size-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 pb-2">
        <SortableContext items={list.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {list.cards.map((card) => (
            <CardItem key={card.id} card={card} listId={list.id} onOpen={() => onOpenCard(card)} />
          ))}
        </SortableContext>
        {list.cards.length === 0 && !adding && (
          <p className="py-4 text-center text-[15px] text-white/50">No cards yet</p>
        )}
        <div ref={cardsEnd} />
      </div>

      {adding ? (
        <form
          className="flex shrink-0 flex-col gap-2 px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault()
            addCard()
          }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Enter a title for this card…"
            aria-label="New card title"
            enterKeyHint="done"
            className="h-12 rounded-xl bg-gradient-to-b from-slate-50 to-slate-200 px-4 text-[16px] text-slate-800 outline-none placeholder:text-slate-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="h-11 flex-1 rounded-xl bg-[#2f80ff] text-[16px] font-semibold text-white">
              Add card
            </button>
            <button
              type="button"
              aria-label="Stop adding cards"
              onClick={() => {
                setAdding(false)
                setDraft('')
              }}
              className="grid size-11 place-items-center rounded-xl text-white/80 active:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[52px] shrink-0 items-center justify-center gap-2 text-[16px] text-white/90 active:bg-white/10"
        >
          <Plus className="size-5" style={{ color: list.accent }} /> New Card
        </button>
      )}
    </section>
  )
}
