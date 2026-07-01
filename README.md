# Board Game Timer

A simple turn timer for **physical** board games — a Progressive Web App you open on one
shared device on the table. It shows whose turn it is, how long they've been thinking this
turn (turning **red** past a configurable limit), their running total, and a live pie chart
of time spent per player. When the game ends it shows per-player and overall statistics you
can share as an image or copy as text.

👉 **Live app:** https://bkrivosik.github.io/board-game-timer/

See [FEATURES.md](./FEATURES.md) for the full feature list and [PLAN.md](./PLAN.md) for the
technical design.

## Develop

```bash
npm install
npm run dev        # start the dev server (open the printed URL)
npm test           # run the timing-engine unit tests
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
```

Requires Node 18+.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app and deploys
it to **GitHub Pages** (Pages source must be set to **GitHub Actions** in the repo settings).
The app is served from the `/board-game-timer/` base path.

## How it works

- The timing logic lives in `src/engine/` as **pure functions** and is fully unit-tested.
- Time is **timestamp-based**, so it stays accurate across pauses, backgrounding, and
  refreshes. A mid-game refresh resumes **paused** so downtime isn't counted.
- The pie chart reflects committed totals and updates when a turn is committed (Next/Prev/End).

## License

[MIT](./LICENSE)
