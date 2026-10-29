import { ChevronRight, LayoutGrid, RefreshCw } from 'lucide-react'
import { applyUpdateNow, BUILD_VERSION, checkNow, formatVersion, useUpdateStatus } from '../liveUpdate'

/**
 * What every app's settings have in common: back to the myApps picker, and which version runs.
 * Light for the meal planner, dark for the kanban board.
 */
export function SettingsRows({ dark, onSwitchApp }: { dark?: boolean; onSwitchApp?: () => void }) {
  const status = useUpdateStatus()
  const card = dark ? 'bg-white/10' : 'bg-white'
  const sep = dark ? 'border-white/10' : 'border-[#e5e5ea]'
  const muted = dark ? 'text-white/50' : 'text-[#8e8e93]'
  const accent = dark ? 'text-emerald-300' : 'text-[#248a3d]'

  return (
    <div className="space-y-6">
      {onSwitchApp && (
        <div>
          <div className={`overflow-hidden rounded-[12px] ${card}`}>
            <button onClick={onSwitchApp} className="flex h-12 w-full items-center gap-3 px-4 text-[17px]">
              <LayoutGrid size={20} className={accent} />
              <span className="flex-1 text-left">Switch app</span>
              <ChevronRight size={18} className={muted} />
            </button>
          </div>
          <p className={`px-4 pt-1.5 text-[13px] ${muted}`}>Back to myApps, to open another app.</p>
        </div>
      )}

      <div>
        <div className={`overflow-hidden rounded-[12px] ${card}`}>
          <div className={`flex h-12 items-center justify-between px-4 text-[17px] ${BUILD_VERSION ? `border-b ${sep}` : ''}`}>
            <span>Version</span>
            <span className={muted}>{BUILD_VERSION ? formatVersion(BUILD_VERSION) : 'development'}</span>
          </div>
          {!BUILD_VERSION ? null : status.state === 'ready' ? (
            <button onClick={() => applyUpdateNow(status.bundleId)} className={`flex h-12 w-full items-center gap-3 px-4 text-[17px] font-semibold ${accent}`}>
              <RefreshCw size={20} /> Update now — new version ready
            </button>
          ) : (
            <button onClick={checkNow} className={`flex h-12 w-full items-center gap-3 px-4 text-[17px] ${accent}`}>
              <RefreshCw size={20} className={status.state === 'downloading' ? 'animate-spin' : ''} />
              {status.state === 'downloading' ? `Downloading ${formatVersion(status.version)}…` : 'Check for updates'}
            </button>
          )}
        </div>
        {status.state === 'error' && <p className="px-4 pt-1.5 text-[13px] text-[#ff3b30]">Update check failed: {status.message}</p>}
      </div>
    </div>
  )
}
