import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Sheet } from './Sheet'
import type { List } from './types'

type Props = {
  list: List
  onRename: (title: string) => void
  onDelete: () => void
  onClose: () => void
}

export function ListMenuSheet({ list, onRename, onDelete, onClose }: Props) {
  const [mode, setMode] = useState<'menu' | 'rename' | 'confirmDelete'>('menu')
  const [name, setName] = useState(list.title)
  const count = list.cards.length

  return (
    <Sheet onClose={onClose} title={<span className="uppercase tracking-wide">{list.title}</span>}>
      {mode === 'menu' && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMode('rename')}
            className="flex h-12 items-center gap-3 rounded-xl bg-white/10 px-4 text-[17px] text-white active:bg-white/20"
          >
            <Pencil className="size-5" /> Rename list
          </button>
          <button
            type="button"
            onClick={() => setMode('confirmDelete')}
            className="flex h-12 items-center gap-3 rounded-xl bg-red-500/15 px-4 text-[17px] text-red-300 active:bg-red-500/30"
          >
            <Trash2 className="size-5" /> Delete list
          </button>
        </div>
      )}

      {mode === 'rename' && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim()) onRename(name.trim())
            onClose()
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="List name"
            enterKeyHint="done"
            className="h-12 rounded-xl border border-white/25 bg-white/10 px-3 text-[18px] text-white outline-none focus:border-sky-400"
          />
          <button type="submit" className="h-12 rounded-xl bg-[#2f80ff] text-[17px] font-semibold text-white">
            Save
          </button>
        </form>
      )}

      {mode === 'confirmDelete' && (
        <div className="flex flex-col gap-3">
          <p className="text-[17px] text-white">
            Delete “{list.title}”{count > 0 && ` and its ${count} card${count === 1 ? '' : 's'}`}? This can't be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              onDelete()
              onClose()
            }}
            className="h-12 rounded-xl bg-red-500 text-[17px] font-semibold text-white active:bg-red-600"
          >
            Delete list
          </button>
          <button type="button" onClick={() => setMode('menu')} className="h-12 text-[16px] text-white/70">
            Keep it
          </button>
        </div>
      )}
    </Sheet>
  )
}
