import { AlignLeft, ArrowRightLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from './Sheet'
import type { Card, List } from './types'

type Props = {
  card: Card
  list: List
  lists: List[]
  onSave: (title: string, description: string) => void
  onMove: (toListId: string) => void
  onDelete: () => void
  onClose: () => void
}

export function CardSheet({ card, list, lists, onSave, onMove, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [mode, setMode] = useState<'edit' | 'move' | 'confirmDelete'>('edit')

  const save = () => {
    if (title.trim()) onSave(title.trim(), description.trim())
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title={
        <span className="text-[15px] font-normal text-white/70">
          in list <span className="font-semibold" style={{ color: list.accent }}>{list.title}</span>
        </span>
      }
    >
      {mode === 'edit' && (
        <div className="flex flex-col gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Card title"
            className="h-12 rounded-xl border border-white/25 bg-white/10 px-3 text-[20px] font-semibold text-white outline-none focus:border-sky-400"
          />

          <label className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[15px] font-semibold text-white/90">
              <AlignLeft className="size-5" /> Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a more detailed description…"
              className="rounded-xl bg-gradient-to-b from-slate-50 to-slate-200 p-3 text-[16px] text-slate-800 outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('move')}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 text-[16px] text-white active:bg-white/20"
            >
              <ArrowRightLeft className="size-5" /> Move to…
            </button>
            <button
              type="button"
              onClick={() => setMode('confirmDelete')}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/15 text-[16px] text-red-300 active:bg-red-500/30"
            >
              <Trash2 className="size-5" /> Delete
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="h-12 flex-1 rounded-xl bg-[#2f80ff] text-[17px] font-semibold text-white active:bg-[#2468d8]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl text-[17px] text-white/80 active:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'move' && (
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-[15px] text-white/70">Move “{card.title}” to</p>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={l.id === list.id}
              onClick={() => {
                onMove(l.id)
                onClose()
              }}
              className="flex h-12 items-center gap-3 rounded-xl bg-white/10 px-4 text-[17px] text-white active:bg-white/20 disabled:opacity-40"
            >
              <span className="size-3 rounded-full" style={{ background: l.accent }} />
              <span className="flex-1 text-left">{l.title}</span>
              {l.id === list.id && <span className="text-[14px] text-white/60">current</span>}
            </button>
          ))}
          <button type="button" onClick={() => setMode('edit')} className="h-12 text-[16px] text-white/70">
            Back
          </button>
        </div>
      )}

      {mode === 'confirmDelete' && (
        <div className="flex flex-col gap-3">
          <p className="text-[17px] text-white">Delete “{card.title}”? This can't be undone.</p>
          <button
            type="button"
            onClick={() => {
              onDelete()
              onClose()
            }}
            className="h-12 rounded-xl bg-red-500 text-[17px] font-semibold text-white active:bg-red-600"
          >
            Delete card
          </button>
          <button type="button" onClick={() => setMode('edit')} className="h-12 text-[16px] text-white/70">
            Keep it
          </button>
        </div>
      )}
    </Sheet>
  )
}
