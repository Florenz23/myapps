import type { CapacitorConfig } from '@capacitor/cli'

// Dev loop on the phone: CAP_DEV_URL=http://<mac-lan-ip>:5183 npx cap sync ios
// Off for real builds — the app then loads the bundled dist/.
const devUrl = process.env.CAP_DEV_URL

// The app id stays the one of last video's Kanban app: myApps installs over it, in the same slot,
// and the kanban board saved on the phone stays.
const config: CapacitorConfig = {
  appId: 'de.florenzerstling.kanban',
  appName: 'myApps',
  webDir: 'dist',
  plugins: {
    // Live updates, self-hosted on GitHub releases (src/liveUpdate.ts decides when).
    // statsUrl '' = no usage stats sent to Capgo.
    CapacitorUpdater: { autoUpdate: false, statsUrl: '' },
  },
  ...(devUrl ? { server: { url: devUrl, cleartext: true } } : {}),
}

export default config
