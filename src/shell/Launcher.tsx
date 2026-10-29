import { APPS, type AppId } from './apps'

/** The first screen of myApps: pick an app, like on the home screen */
export function Launcher({ onPick }: { onPick: (id: AppId) => void }) {
  return (
    <div className="safe-top mx-auto h-full max-w-[430px] bg-bg px-5">
      <h1 className="pt-14 text-[34px] leading-tight font-bold tracking-tight">myApps</h1>
      <p className="pt-1 text-[15px] text-label2">One app on your phone, all your apps inside.</p>
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 pt-10">
        {APPS.map(({ id, name, Icon, colors }) => (
          <button key={id} onClick={() => onPick(id)} className="flex flex-col items-center gap-2 active:opacity-70">
            <span
              className="flex aspect-square w-full max-w-[84px] items-center justify-center rounded-[22%] text-white shadow-sm"
              style={{ background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})` }}
            >
              <Icon size={40} strokeWidth={1.8} />
            </span>
            <span className="text-[13px] font-medium">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
