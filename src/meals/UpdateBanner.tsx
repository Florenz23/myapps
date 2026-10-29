import { RefreshCw } from 'lucide-react'
import { applyUpdateNow, useUpdateStatus } from '../liveUpdate'

/** A live update has downloaded: one tap switches to it. The plan is saved on every change. */
export function UpdateBanner() {
  const status = useUpdateStatus()
  if (status.state !== 'ready') return null
  return (
    <div
      className="anim-pop fixed inset-x-0 z-20 mx-auto flex max-w-[400px] px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
    >
      <div className="flex flex-1 items-center gap-3 rounded-[14px] bg-tint py-1.5 pr-1.5 pl-4 shadow-md ring-1 ring-accent/30">
        <span className="flex-1 text-[15px]">New version ready</span>
        <button
          onClick={() => applyUpdateNow(status.bundleId)}
          className="flex h-10 items-center gap-1.5 rounded-[10px] bg-accent px-3.5 text-[15px] font-semibold text-white"
        >
          <RefreshCw size={16} /> Update now
        </button>
      </div>
    </div>
  )
}
