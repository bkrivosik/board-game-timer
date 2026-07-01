# Board Game Timer — Features (v1)

A turn timer for **physical** board games. One shared device sits on the table and
tracks how long each player spends on their turns.

## Setup
- Add **2–10 players**, each with a **name** and an auto-assigned, editable **colour**
  (used in the pie chart and the play screen). Names must be non-empty; duplicates are
  allowed (colours tell players apart).
- Set a single **global max desired time per turn** (minutes + seconds). Going over is
  allowed — it's just flagged.
- Choose the **starting player** from a list, or **🎲 randomize** it.
- Optional **session name** (shown on the play screen and in exported stats).
- Reorder players (↑/↓) and remove players (down to a minimum of two).

## Live turn view
- The **active player's name** in their colour, with the current **turn number** and a
  **"Next: …"** hint for who's up.
- **Current-turn timer** `m:ss`, counting up. It **turns red and pulses** once the turn
  passes the global max (overtime keeps counting — there is no cap).
- The active player's **total time** so far, plus the configured max, underneath.
- A **pie chart** of total time per player. It reflects *committed* time and updates
  **when a turn is committed** (Next / Prev / End), with a colour legend showing each
  player's running total.

## Controls
- **Next (▶)** — commit the current turn and move to the next player.
- **Prev (◀)** — **undo the last Next** (or Skip). Misclick correction: the mis-started
  turn is discarded and the previous player's timer resumes exactly where it left off.
- **Skip** — the current player sits this turn out; their in-progress time is discarded
  and play advances. (Also undoable with Prev.)
- **Pause / Resume** — freezes all timing.
- **End game** — commits the final in-progress turn and shows statistics.

## End-of-game statistics
- Per player: **total time**, **# turns**, **average per turn**, **longest turn**,
  **overtime turns & total overtime**, and **% of total think-time**.
- Overall: **total elapsed** (wall-clock), **total think-time**, and the
  **fastest / slowest** player by average turn.
- Final **pie chart**.
- **Export / share**: a shareable **image card** (PNG, via the Web Share API on mobile or
  a download otherwise) and a **copyable text** summary.
- **New game** keeping the same players (for a rematch) or starting fresh.

## Quality-of-life
- **Keeps the screen awake** during play (Screen Wake Lock, where supported).
- **Auto-saves** on every change; a refresh or crash mid-game **resumes as paused** so the
  time the tab spent closed is never counted against a player.
- **Installable PWA**, works **offline**.

## Out of scope (v1)
Per-turn history log UI, per-player time limits, sound/haptic alerts, pre-warning before
the limit, 3-letter player shortcuts, and networked multi-device play.
