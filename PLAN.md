# Board Game Timer — Technical Notes

## Stack
- **React + Vite + TypeScript**, single-page app, client-only (no backend).
- **PWA** via `vite-plugin-pwa` (installable, offline, service worker + manifest).
- **Vitest** for unit tests over the timing engine and stats.
- Deployed to **GitHub Pages** at `/board-game-timer/` (see below).

## Architecture
Three views driven by game status: **Setup → Play → Stats**.

```
src/
  engine/          pure, framework-free timing logic (unit-tested)
    types.ts       Player, GameConfig, GameState, TurnRecord, UndoEntry
    timer.ts       start / next / prev / skip / pause / resume / end + selectors
    stats.ts       derive per-player + overall stats from committed history
  state/
    persistence.ts localStorage save/load; resume-as-paused
    useGame.ts     useReducer wrapping the engine + persistence
  hooks/
    useNow.ts      250ms tick while running (re-renders time displays)
    useWakeLock.ts screen wake lock while running
  util/
    format.ts      time formatting, colour palette, ids
    pie.ts         pie slice geometry (shared by SVG chart + PNG export)
  components/       SetupView, PlayView, StatsView, PieChart, Controls
  export/           exportText (clipboard) + exportImage (canvas → PNG / share)
```

### Timing model
The engine is a set of **pure functions** `(state, now) => state`; `now` (a ms timestamp)
is injected by the caller, which makes everything deterministic and test-friendly.

Time is **timestamp-based**: the state stores `turnStartedAt` and `currentTurnBaseMs`, and
the current-turn elapsed is computed on demand as
`base + (running ? now - turnStartedAt : 0)`. This stays correct across tab throttling,
backgrounding, pause/resume, and refresh — nothing relies on a counter being ticked.

- **Next** commits a `TurnRecord` (duration + overtime) to `history` and `totals`, pushes
  an undo entry, and advances.
- **Prev** pops the last undo entry and reverses it exactly (restores index, rolls back the
  committed total, and resumes the previous player's timer at its prior elapsed).
- **Skip** discards the in-progress time and advances (also undoable).
- **Pause** folds the live segment into `currentTurnBaseMs`; **Resume** restarts the segment.
- **End** commits the final in-progress turn so it counts.

The **pie chart uses committed `totals`** only (excludes the in-progress turn), which is why
it refreshes on Next/Prev/End rather than every tick.

### Persistence / resume
State is saved to `localStorage` on every change, and a **frozen** snapshot is written on
`pagehide` / tab-hide. On load, a game that was `running` is restored as **paused** so the
closed-tab interval is never attributed to the active player.

## Deployment (GitHub Pages via GitHub Actions)
- Repo: `bkrivosik/board-game-timer`; Vite `base = /board-game-timer/`.
- `.github/workflows/deploy.yml` builds on push to `main` and deploys with
  `actions/upload-pages-artifact` + `actions/deploy-pages` (uses the built-in `GITHUB_TOKEN`).
- Pages **source = GitHub Actions**.
- Live at `https://bkrivosik.github.io/board-game-timer/`.

## Commands
- `npm run dev` — dev server
- `npm test` — unit tests
- `npm run build` — type-check + production build to `dist/`
- `npm run preview` — serve the built app
