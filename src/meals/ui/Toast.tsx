import { useEffect } from 'react'

export interface ToastData {
  id: number
  text: string
  undo?: () => void
}

/** A short message above the tab bar. Deletes carry an Undo instead of a confirm dialog. */
export function Toast({ data, onDone }: { data: ToastData; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, data.undo ? 5000 : 2500)
    return () => clearTimeout(t)
  }, [data, onDone])

  return (
    <div
      key={data.id}
      className="anim-pop fixed inset-x-0 z-50 mx-auto flex max-w-[400px] px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      <div className="flex min-h-[48px] flex-1 items-center justify-between gap-3 rounded-[14px] bg-[#1c1c1e]/95 px-4 text-[15px] text-white shadow-lg">
        <span className="py-3">{data.text}</span>
        {data.undo && (
          <button
            className="-mr-2 h-11 px-2 font-semibold text-accent"
            onClick={() => {
              data.undo!()
              onDone()
            }}
          >
            Undo
          </button>
        )}
      </div>
    </div>
  )
}
