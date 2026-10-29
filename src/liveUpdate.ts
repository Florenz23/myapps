import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { useSyncExternalStore } from 'react'

// Every push to main publishes the web part as dist-<version>.zip on the release "web-myapps"
// (.github/workflows/web.yml). The app looks it up through the GitHub API (real JSON, readable
// from the app), downloads a newer one in the background and switches to it the next time it's
// closed and opened again. No new .ipa needed.
const RELEASE_API = 'https://api.github.com/repos/Florenz23/myapps/releases/tags/web-myapps'

// The commit time of this build (seconds). Newer commit = higher number, so updates only go forward.
export const BUILD_VERSION = Number(import.meta.env.VITE_WEB_VERSION ?? 0)

type Status =
  | { state: 'idle' }
  | { state: 'downloading'; version: number }
  | { state: 'ready'; version: number; bundleId: string }
  | { state: 'error'; message: string }

let status: Status = { state: 'idle' }
const listeners = new Set<() => void>()
const setStatus = (next: Status) => {
  status = next
  listeners.forEach((l) => l())
}

// What the newest published web part is, from the release's asset name: dist-<version>.zip
export async function findLatest() {
  const res = await fetch(RELEASE_API, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const release: { assets: { name: string; browser_download_url: string; digest?: string }[] } = await res.json()
  const asset = release.assets.find((a) => /^dist-\d+\.zip$/.test(a.name))
  if (!asset) throw new Error('no update file in the release')
  // GitHub gives every file a SHA-256 ("sha256:<hex>"); the updater checks the download against it.
  const checksum = asset.digest?.replace(/^sha256:/, '')
  if (!checksum) throw new Error('no checksum for the update file')
  return { version: Number(asset.name.match(/\d+/)![0]), url: asset.browser_download_url, checksum }
}

async function checkForUpdate() {
  if (status.state === 'downloading') return
  const latest = await findLatest()
  if (!(latest.version > BUILD_VERSION)) return

  setStatus({ state: 'downloading', version: latest.version })
  const { bundles } = await CapacitorUpdater.list()
  const ready = bundles.find((b) => b.version === String(latest.version) && b.status === 'success')
  const bundle = ready ?? (await CapacitorUpdater.download({ url: latest.url, version: String(latest.version), checksum: latest.checksum }))
  await CapacitorUpdater.next({ id: bundle.id })
  setStatus({ state: 'ready', version: latest.version, bundleId: bundle.id })
}

// Every 2 minutes while the app is open. GitHub allows ~60 unauthenticated API calls per hour
// per network, shared by all apps on it, so not more often.
const CHECK_EVERY_MS = 2 * 60 * 1000

// Check now; also what tapping the version line does.
export const checkNow = () =>
  checkForUpdate().catch((e: unknown) =>
    setStatus({ state: 'error', message: e instanceof Error ? e.message : String(e) }),
  )

export function startLiveUpdates() {
  if (!Capacitor.isNativePlatform()) return
  // Tells the updater this version started fine; without it, it rolls back to the previous one.
  CapacitorUpdater.notifyAppReady()

  checkNow()
  setInterval(() => {
    if (document.visibilityState === 'visible' && status.state !== 'ready') checkNow()
  }, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkNow()
  })
}

// Switch to the downloaded version right away. The board is saved on every change, so nothing is lost.
export const applyUpdateNow = (bundleId: string) => CapacitorUpdater.set({ id: bundleId })

export function useUpdateStatus() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => status,
  )
}

export const formatVersion = (v: number) =>
  new Date(v * 1000).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
