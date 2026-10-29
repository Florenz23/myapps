import { useCallback, useEffect, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import type { State } from './types'
import { housekeeping } from './logic'
import { seedState } from './seed'
import { todayRef } from './weeks'

// One saved document in IndexedDB (iOS can clear a WebView's localStorage).
// The starter data only appears after the load found nothing.
const KEY = 'meal-planner-v1'

export function useStore() {
  const [state, setState] = useState<State | null>(null)
  const ref = useRef<State | null>(null)

  const commit = useCallback((s: State) => {
    ref.current = s
    setState(s)
    set(KEY, s).catch(() => {})
  }, [])

  const update = useCallback(<R,>(fn: (s: State) => R): R => {
    const s = structuredClone(ref.current!)
    const result = fn(s)
    commit(s)
    return result
  }, [commit])

  useEffect(() => {
    let alive = true
    get<State>(KEY)
      .catch(() => undefined)
      .then((saved) => {
        if (!alive) return
        const today = todayRef()
        const s = saved?.version === 1 ? saved : seedState(today)
        housekeeping(s, today)
        commit(s)
      })
    // The app can stay open for days on the phone: new weeks appear, past ticks let go
    const onShow = () => {
      if (document.visibilityState === 'visible' && ref.current) update((s) => housekeeping(s, todayRef()))
    }
    document.addEventListener('visibilitychange', onShow)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [commit, update])

  const snapshot = useCallback(() => ref.current!, [])

  return { state, update, snapshot, restore: commit }
}
