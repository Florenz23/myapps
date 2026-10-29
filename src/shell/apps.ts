import { lazy } from 'react'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { CalendarDays, SquareKanban, type LucideIcon } from 'lucide-react'

// The apps inside myApps. One installed iPhone app, so one slot of the free Apple ID.
export type AppId = 'meals' | 'kanban'

export interface AppInfo {
  id: AppId
  name: string
  Icon: LucideIcon
  /** Tile colors, top → bottom */
  colors: [string, string]
  /** Dark text in the status bar on a light app, light text on a dark one */
  statusBar: Style
  Component: React.LazyExoticComponent<React.ComponentType<{ onSwitchApp?: () => void }>>
}

export const APPS: AppInfo[] = [
  {
    id: 'meals',
    name: 'Meal Planner',
    Icon: CalendarDays,
    colors: ['#5fe07c', '#2bb04f'],
    statusBar: Style.Light,
    Component: lazy(() => import('../meals/MealsApp')),
  },
  {
    id: 'kanban',
    name: 'Kanban',
    Icon: SquareKanban,
    colors: ['#4d7be8', '#1f3f8f'],
    statusBar: Style.Dark,
    Component: lazy(() => import('../kanban/Board').then((m) => ({ default: m.Board }))),
  },
]

// Which app opens on start. Small and only a convenience: if it's ever lost, the picker shows.
const KEY = 'myapps.current'

export function savedApp(): AppId | null {
  try {
    const id = localStorage.getItem(KEY)
    return APPS.some((a) => a.id === id) ? (id as AppId) : null
  } catch {
    return null
  }
}

export function saveApp(id: AppId | null) {
  try {
    if (id) localStorage.setItem(KEY, id)
    else localStorage.removeItem(KEY)
  } catch {
    /* private mode: the picker simply shows next time */
  }
}

export function setStatusBar(style: Style) {
  if (Capacitor.isNativePlatform()) StatusBar.setStyle({ style }).catch(() => {})
}
