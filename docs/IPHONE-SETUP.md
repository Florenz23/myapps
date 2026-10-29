# myApps on the iPhone — how it gets there (2026-10-29)

The phone setup (LocalDevVPN, SideStore, free Apple ID) is the one from the last video:
`../62-kanban-capacitor/docs/IPHONE-SETUP.md`. Nothing new to install.

## One app, all apps inside

- myApps = the meal planner + last video's kanban, behind a picker. Each app's **Settings** has
  **Switch app**.
- App id `de.florenzerstling.kanban`, the same as last video's Kanban: myApps installs **over** it,
  in the same slot, and the kanban board saved on the phone stays.
- Free Apple ID: 3 sideloaded apps; SideStore + myApps = 2. New apps go *inside* myApps.

## Where it builds

- Source of truth: this folder in `video-builds`. Commit here, never in the build repo.
- Build repo: public `Florenz23/myapps` (free macOS minutes need a public repo; workflows only run
  from a repo root). Mirror it after committing:

  ```bash
  git -C ~/Workspace/video-builds subtree split --prefix=florenz-erstling-en/63-app-meal-planner -b myapps-public
  git -C ~/Workspace/video-builds push git@github.com:Florenz23/myapps.git myapps-public:main
  ```

- **Every push = a live update** (`web.yml`, ~20 s): `dist-<version>.zip` on the release
  `web-myapps`. The app finds it, downloads it, and shows **New version ready · Update now**
  (meal planner: above the tab bar; both apps: Settings → Check for updates).
- **Native changes need an .ipa** (name, icon, plugins, native version): Actions → iOS build →
  Run workflow (~2.5 min) → on the phone `github.com/Florenz23/myapps/releases` → myApps.ipa →
  Open in… → SideStore.

## Gotchas met on the way

- **A brand-new repo didn't know the manual iOS workflow** (`workflow ios.yml not found`). It got
  registered only after a second push that changed the file.
- **First install opened the old kanban board** (new icon, old content): the live updater kept last
  video's downloaded web part, because the native version was unchanged (1.0). Raising the native
  version to **2.0** makes it throw old downloads away (`resetWhenUpdate`, on by default).
  Next native release: raise it again (`MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in
  `ios/App/App.xcodeproj/project.pbxproj`).
