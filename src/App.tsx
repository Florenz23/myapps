import { Suspense, useEffect, useState } from 'react'
import { Style } from '@capacitor/status-bar'
import { APPS, saveApp, savedApp, setStatusBar, type AppId } from './shell/apps'
import { Launcher } from './shell/Launcher'

// myApps: opens the app used last; "Switch app" inside each app leads back to the picker.
export default function App() {
  const [current, setCurrent] = useState<AppId | null>(savedApp)
  const app = APPS.find((a) => a.id === current)

  useEffect(() => setStatusBar(app?.statusBar ?? Style.Light), [app])

  if (!app) {
    return (
      <Launcher
        onPick={(id) => {
          saveApp(id)
          setCurrent(id)
        }}
      />
    )
  }

  const switchApp = () => {
    saveApp(null)
    // A fresh start, so the open app's styles don't leak into the next one
    location.reload()
  }

  return (
    <Suspense fallback={null}>
      <app.Component onSwitchApp={switchApp} />
    </Suspense>
  )
}
