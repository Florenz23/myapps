import { RefreshCw, Settings } from 'lucide-react'
import { applyUpdateNow, useUpdateStatus } from '../liveUpdate'

// The banner when a live update is ready, and the way into the settings.
export function VersionLine({ onOpenSettings }: { onOpenSettings: () => void }) {
  const status = useUpdateStatus()
  return (
    <>
      {status.state === 'ready' && (
        <div className="mx-4 mb-2 flex shrink-0 items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/20 py-2 pl-4 pr-2 backdrop-blur-xl">
          <span className="flex-1 text-[15px] text-white">New version ready</span>
          <button
            type="button"
            onClick={() => applyUpdateNow(status.bundleId)}
            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-[16px] font-semibold text-emerald-950 active:bg-emerald-300"
          >
            <RefreshCw className="size-4" /> Update now
          </button>
        </div>
      )}
      {/* Version, updates and Switch app live in the settings */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="mx-auto flex min-h-8 shrink-0 items-center gap-1.5 px-4 pb-1 text-[12px] text-white/50 active:text-white/80"
      >
        <Settings className="size-3.5" /> Settings
      </button>
    </>
  )
}
