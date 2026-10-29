import { useState } from 'react'
import { Sheet } from './Sheet'

export function NewListSheet({ onAdd, onClose }: { onAdd: (title: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  return (
    <Sheet onClose={onClose} title="New list">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onAdd(name.trim())
          onClose()
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          aria-label="List name"
          enterKeyHint="done"
          className="h-12 rounded-xl border border-white/25 bg-white/10 px-3 text-[18px] text-white outline-none placeholder:text-white/40 focus:border-sky-400"
        />
        <button type="submit" className="h-12 rounded-xl bg-[#2f80ff] text-[17px] font-semibold text-white">
          Add list
        </button>
      </form>
    </Sheet>
  )
}
