import { useCallback, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChefHat, Settings, ShoppingCart } from 'lucide-react'
import { Ctx, listMsg, type AppCtx } from './ctx'
import { useStore } from './useStore'
import { dishOf, slotAt, splitList, tick, untick } from './logic'
import type { DayRef, State } from './types'
import { todayRef } from './weeks'
import { PlanTab } from './plan/PlanTab'
import { ShoppingTab } from './shopping/ShoppingTab'
import { DishesTab } from './dishes/DishesTab'
import { SettingsTab } from './SettingsTab'
import { UpdateBanner } from './UpdateBanner'
import { DishSheet } from './DishSheet'
import { IngredientsPrompt } from './plan/IngredientsPrompt'
import { Toast, type ToastData } from './ui/Toast'

type Tab = 'plan' | 'shopping' | 'dishes' | 'settings'

const TABS: { id: Tab; label: string; Icon: typeof CalendarDays }[] = [
  { id: 'plan', label: 'Plan', Icon: CalendarDays },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingCart },
  { id: 'dishes', label: 'Dishes', Icon: ChefHat },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

/** The meal planner. Inside myApps, onSwitchApp leads back to the app picker. */
export default function MealsApp({ onSwitchApp }: { onSwitchApp?: () => void }) {
  const { state, update, snapshot, restore } = useStore()
  const [tab, setTab] = useState<Tab>('plan')
  const [toastData, setToastData] = useState<ToastData | null>(null)
  const [dishOpen, setDishOpen] = useState<{ dishId: string; occurrence?: DayRef } | null>(null)
  const [ask, setAsk] = useState<{ refs: DayRef[]; added: number } | null>(null)
  const toastSeq = useRef(0)

  const toast = useCallback((text: string, undo?: () => void) => {
    setToastData({ id: ++toastSeq.current, text, undo })
  }, [])

  const withUndo = useCallback(<R,>(fn: (s: State) => R, text: (result: R) => string): R => {
    const before = snapshot()
    const result = update(fn)
    toast(text(result), () => restore(before))
    return result
  }, [snapshot, update, toast, restore])

  const askIngredients = useCallback((refs: DayRef[], addedBefore = 0) => {
    if (refs.length) setAsk({ refs, added: addedBefore })
    else toast(listMsg(addedBefore, 0))
  }, [toast])

  const toggleTick = useCallback((r: DayRef) => {
    const s = snapshot()
    const slot = slotAt(s, r)
    const dish = dishOf(s, slot)
    if (!slot || !dish) return
    const today = todayRef()
    if (slot.buy) toast(listMsg(0, update((d) => untick(d, r, today))))
    else if (dish.ingredients === null) setAsk({ refs: [r], added: 0 })
    else toast(listMsg(update((d) => tick(d, r, today)), 0))
  }, [snapshot, toast, update])

  const ctx = useMemo<AppCtx | null>(() => state && {
    state,
    today: todayRef(),
    update,
    withUndo,
    toast,
    toggleTick,
    askIngredients,
    openDish: (dishId, occurrence) => setDishOpen({ dishId, occurrence }),
  }, [state, update, withUndo, toast, toggleTick, askIngredients])

  if (!ctx) return null

  // The "which ingredients?" question: Save ticks the day, Cancel leaves it unticked (rule 9)
  const askRef = ask?.refs[0]
  const askDish = askRef && dishOf(ctx.state, slotAt(ctx.state, askRef))
  const nextAsk = (added: number) => {
    const rest = ask!.refs.slice(1)
    if (rest.length) setAsk({ refs: rest, added })
    else {
      setAsk(null)
      toast(listMsg(added, 0))
    }
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="relative mx-auto flex h-full max-w-[430px] flex-col bg-bg">
        <main className="safe-top no-scrollbar flex-1 overflow-y-auto pb-24">
          {tab === 'plan' && <PlanTab />}
          {tab === 'shopping' && <ShoppingTab />}
          {tab === 'dishes' && <DishesTab />}
          {tab === 'settings' && <SettingsTab onSwitchApp={onSwitchApp} />}
        </main>

        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-sep bg-[#f9f9f9]/90 backdrop-blur-xl">
          <div className="flex h-[52px]">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  tab === id ? 'text-accent' : 'text-label2'
                }`}
              >
                <Icon size={24} strokeWidth={tab === id ? 2.2 : 1.8} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {!toastData && <UpdateBanner />}
        {toastData && <Toast data={toastData} onDone={() => setToastData(null)} />}

        {dishOpen && (
          <DishSheet
            key={dishOpen.dishId + (dishOpen.occurrence ? `@${dishOpen.occurrence.key}#${dishOpen.occurrence.idx}` : '')}
            dishId={dishOpen.dishId}
            occurrence={dishOpen.occurrence}
            onClose={() => setDishOpen(null)}
          />
        )}

        {askRef && askDish && (
          <IngredientsPrompt
            key={`${askRef.key}#${askRef.idx}`}
            dishName={askDish.name}
            onCancel={() => nextAsk(ask!.added)}
            onSave={(text) => {
              const added = update((s) => {
                const d = s.dishes.find((x) => x.id === askDish.id)!
                d.ingredients = splitList(text)
                return tick(s, askRef, todayRef())
              })
              nextAsk(ask!.added + added)
            }}
          />
        )}
      </div>
    </Ctx.Provider>
  )
}
