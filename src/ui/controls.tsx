import { Check } from 'lucide-react'

/** Black iOS-style checkbox inside a 44 px tap target */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-[6px] border-[1.5px] ${
          checked ? 'border-black bg-black text-white' : 'border-label3 bg-white'
        }`}
      >
        {checked && <Check size={17} strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Green = has ingredients, grey = known with nothing to buy, outline = not asked yet */
export function StatusDot({ ingredients }: { ingredients: string[] | null }) {
  if (ingredients === null) return <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-label2" />
  return <span className={`h-2.5 w-2.5 rounded-full ${ingredients.length ? 'bg-accent' : 'bg-label3'}`} />
}

export function Segmented<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-[9px] bg-fill p-[2px]">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 flex-1 rounded-[7px] text-[13px] font-semibold ${
            value === o.value ? 'bg-white shadow-sm' : 'text-black/80'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Grey grouped-list section title */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-5 pb-1.5 text-[13px] uppercase tracking-wide text-label2">{children}</div>
}
