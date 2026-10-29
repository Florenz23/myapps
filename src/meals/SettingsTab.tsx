import { SettingsRows } from '../shell/SettingsRows'

export function SettingsTab({ onSwitchApp }: { onSwitchApp?: () => void }) {
  return (
    <div className="px-4">
      <h1 className="px-1 pt-10 pb-4 text-[34px] leading-tight font-bold tracking-tight">Settings</h1>
      <SettingsRows onSwitchApp={onSwitchApp} />
    </div>
  )
}
