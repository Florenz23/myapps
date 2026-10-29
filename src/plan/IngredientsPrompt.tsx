import { useEffect, useState } from 'react'

/** The "which ingredients?" question, as an iOS alert. Empty = never buy anything for this dish. */
export function IngredientsPrompt({ dishName, onSave, onCancel }: {
  dishName: string
  onSave: (text: string) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-center justify-center px-12">
      <div className="anim-fade absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="anim-pop relative w-full max-w-[290px] overflow-hidden rounded-[14px] bg-[#f2f2f2]/95 text-center backdrop-blur-xl">
        <div className="px-4 pt-5 pb-4">
          <div className="text-[17px] font-semibold">{dishName}</div>
          <div className="mt-1 text-[13px] leading-snug">
            Which ingredients? Comma separated. Leave empty if you never buy anything for it.
          </div>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave(text)}
            placeholder="pasta, tuna, sweetcorn"
            enterKeyHint="done"
            className="mt-3 h-9 w-full rounded-[7px] border border-sep bg-white px-2 text-[16px] outline-none"
          />
        </div>
        <div className="flex border-t border-[#c8c8cc]">
          <button onClick={onCancel} className="h-11 flex-1 text-[17px] text-accent-ink">Cancel</button>
          <button onClick={() => onSave(text)} className="h-11 flex-1 border-l border-[#c8c8cc] text-[17px] font-semibold text-accent-ink">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
