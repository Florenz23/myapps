import { useEffect, type ReactNode } from 'react'

/** An iOS bottom sheet: dimmed backdrop, rounded top, grabber. Tap outside or Escape closes it. */
export function Sheet({ onClose, children, tall }: { onClose: () => void; children: ReactNode; tall?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 mx-auto max-w-[430px]">
      <div className="anim-fade absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={`anim-sheet safe-bottom absolute inset-x-0 bottom-0 flex flex-col rounded-t-[14px] bg-bg shadow-2xl ${
          tall ? 'h-[94%]' : 'max-h-[88%]'
        }`}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-[5px] w-9 rounded-full bg-label3" />
        </div>
        {children}
      </div>
    </div>
  )
}
