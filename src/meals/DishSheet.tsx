import { useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { listMsg, useApp } from './ctx'
import { clampDays, deleteDish, findDish, setSpan, slotAt, splitList, updateDish } from './logic'
import type { DayRef } from './types'
import { DAY_SHORT } from './weeks'
import { Sheet } from './ui/Sheet'
import { Segmented, SectionLabel } from './ui/controls'

/**
 * Dish details. Opened from a day (occurrence set: "days in a row" is for this time only)
 * or from the Dishes tab ("days in a row" is the dish's default).
 */
export function DishSheet({ dishId, occurrence, onClose }: { dishId: string; occurrence?: DayRef; onClose: () => void }) {
  const { state, today, update, withUndo, toast } = useApp()
  const dish = state.dishes.find((d) => d.id === dishId)
  const slot = occurrence ? slotAt(state, occurrence) : null

  const [name, setName] = useState(dish?.name ?? '')
  const [aliases, setAliases] = useState(dish?.aliases.join(', ') ?? '')
  const [weekend, setWeekend] = useState(dish?.weekend ?? false)
  const [days, setDays] = useState(slot?.span ?? dish?.days ?? 1)
  const [ingredients, setIngredients] = useState<string[] | null>(dish?.ingredients ?? null)
  const [newIng, setNewIng] = useState('')
  const [prep, setPrep] = useState(dish?.prep ?? '')

  if (!dish) return null
  const clash = findDish(state, name)
  const nameError = !name.trim() ? 'A dish needs a name' : clash && clash.id !== dish.id ? `“${clash.name}” already exists` : ''

  const addIng = () => {
    const extra = splitList(newIng)
    if (!extra.length) return
    setIngredients(splitList([...(ingredients ?? []), ...extra].join(',')))
    setNewIng('')
  }

  const save = () => {
    if (nameError) return
    const finalIngredients = newIng.trim() ? splitList([...(ingredients ?? []), newIng].join(',')) : ingredients
    const r = update((s) => {
      const res = updateDish(s, dish.id, {
        name,
        aliases: aliases.split(','),
        weekend,
        days: occurrence ? dish.days : days,
        ingredients: finalIngredients,
        prep,
      }, today)
      if (occurrence) res.removed += setSpan(s, occurrence, clampDays(days), today)
      return res
    })
    if (r.added || r.removed) toast(listMsg(r.added, r.removed))
    onClose()
  }

  const remove = () => {
    withUndo((s) => deleteDish(s, dish.id, today), (removed) => `${dish.name} deleted${removed ? ` · ${listMsg(0, removed)}` : ''}`)
    onClose()
  }

  const field = 'h-11 w-full bg-transparent px-4 outline-none placeholder:text-label3'

  return (
    <Sheet onClose={onClose} tall>
      <div className="flex items-center justify-between px-4 pb-1">
        <button onClick={onClose} className="h-11 text-[17px] text-accent-ink">Cancel</button>
        <div className="max-w-[55%] truncate text-[17px] font-semibold">{dish.name}</div>
        <button onClick={save} disabled={!!nameError} className="h-11 text-[17px] font-semibold text-accent-ink disabled:text-label3">
          Done
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-8">
        <SectionLabel>Name</SectionLabel>
        <div className="overflow-hidden rounded-[12px] bg-card">
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} aria-label="Name" />
        </div>
        {nameError && <div className="px-4 pt-1.5 text-[13px] text-danger">{nameError}</div>}

        <SectionLabel>Other spellings</SectionLabel>
        <div className="overflow-hidden rounded-[12px] bg-card">
          <input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="Comma separated" className={field} aria-label="Other spellings" />
        </div>

        <div className="mt-6 space-y-2">
          <Segmented
            value={weekend ? 'weekend' : 'weekday'}
            onChange={(v) => setWeekend(v === 'weekend')}
            options={[{ value: 'weekday', label: 'Weekday' }, { value: 'weekend', label: 'Weekend' }]}
          />
        </div>

        <div className="mt-6 flex h-12 items-center justify-between rounded-[12px] bg-card pr-2 pl-4">
          <span>Days in a row</span>
          <div className="flex items-center gap-1">
            <span className="w-8 text-center text-[17px] font-semibold tabular-nums">{days}</span>
            <div className="flex overflow-hidden rounded-[8px] bg-fill">
              <button aria-label="Fewer days" disabled={days <= 1} onClick={() => setDays(clampDays(days - 1))} className="flex h-8 w-11 items-center justify-center disabled:opacity-30">
                <Minus size={18} />
              </button>
              <div className="my-1.5 w-px bg-label3" />
              <button aria-label="More days" disabled={days >= 7} onClick={() => setDays(clampDays(days + 1))} className="flex h-8 w-11 items-center justify-center disabled:opacity-30">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 pt-1.5 text-[13px] text-label2">
          {occurrence ? `Only this time, from ${DAY_SHORT[occurrence.idx]}` : 'The default when you pick this dish'}
        </div>

        <SectionLabel>Ingredients</SectionLabel>
        <div className="overflow-hidden rounded-[12px] bg-card pl-4">
          {(ingredients ?? []).map((ing) => (
            <div key={ing} className="flex h-11 items-center border-b border-sep pr-1">
              <span className="flex-1 truncate">{ing}</span>
              <button aria-label={`Remove ${ing}`} onClick={() => setIngredients((ingredients ?? []).filter((x) => x !== ing))} className="flex h-11 w-11 items-center justify-center text-label2">
                <X size={18} />
              </button>
            </div>
          ))}
          <div className="flex h-11 items-center gap-2 pr-1">
            <Plus size={20} className="shrink-0 text-accent-ink" />
            <input
              value={newIng}
              onChange={(e) => setNewIng(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIng()}
              placeholder="Add ingredient"
              enterKeyHint="done"
              className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-label3"
            />
          </div>
        </div>
        <div className="px-4 pt-1.5 text-[13px] text-label2">
          {ingredients === null ? 'Not asked yet — ticking the day will ask' : !ingredients.length ? 'Nothing to buy for this dish' : 'Ticking a day puts these on the main list'}
        </div>

        <SectionLabel>Preparation</SectionLabel>
        <div className="overflow-hidden rounded-[12px] bg-card">
          <textarea
            value={prep}
            onChange={(e) => setPrep(e.target.value)}
            placeholder="One step per line (optional)"
            rows={4}
            className="block w-full resize-none bg-transparent px-4 py-3 leading-snug outline-none placeholder:text-label3"
          />
        </div>

        {!occurrence && (
          <button onClick={remove} className="mt-8 h-12 w-full rounded-[12px] bg-card text-[17px] text-danger">
            Delete dish
          </button>
        )}
      </div>
    </Sheet>
  )
}
