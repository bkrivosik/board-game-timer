import type { GameState } from '../engine/types'
import { currentTurnMs } from '../engine/timer'

const KEY = 'bgt:state:v1'

interface StoredState extends GameState {
  savedAt: number
}

export function saveState(state: GameState): void {
  try {
    const blob: StoredState = { ...state, savedAt: Date.now() }
    localStorage.setItem(KEY, JSON.stringify(blob))
  } catch {
    // storage full / disabled — non-fatal
  }
}

/**
 * Persist a snapshot with the in-progress turn frozen into `currentTurnBaseMs`.
 * Called on tab-hide/unload so a mid-turn refresh keeps the elapsed time.
 */
export function saveFrozen(state: GameState, now: number): void {
  if (state.status !== 'running') {
    saveState(state)
    return
  }
  const frozen: GameState = {
    ...state,
    currentTurnBaseMs: currentTurnMs(state, now),
    turnStartedAt: null,
  }
  saveState(frozen)
}

/**
 * Load a persisted game. A game that was `running` is restored as `paused` so
 * the time the tab spent closed is never attributed to the active player. Any
 * live segment not captured by a freeze is recovered from `savedAt`.
 */
export function loadState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredState
    const { savedAt, ...state } = stored

    if (state.status === 'running') {
      const extra =
        state.turnStartedAt != null
          ? Math.max(0, (savedAt ?? state.turnStartedAt) - state.turnStartedAt)
          : 0
      return {
        ...state,
        status: 'paused',
        turnStartedAt: null,
        currentTurnBaseMs: state.currentTurnBaseMs + extra,
      }
    }
    return state
  } catch {
    return null
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
