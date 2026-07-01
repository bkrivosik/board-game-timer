import type { GameConfig, GameState, Player, TurnRecord } from './types'

/**
 * Pure timing engine. Every mutating function has the signature
 * `(state, now) => nextState` and returns a fresh object (no in-place mutation),
 * where `now` is a millisecond timestamp injected by the caller so behaviour is
 * fully deterministic and unit-testable.
 */

function zeroTotals(players: Player[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const p of players) totals[p.id] = 0
  return totals
}

/** State for a freshly configured game that has not started yet. */
export function createInitialState(config: GameConfig): GameState {
  const startingPlayerIndex = clampIndex(config.startingPlayerIndex, config.players.length)
  return {
    config: { ...config, startingPlayerIndex },
    status: 'setup',
    currentIndex: startingPlayerIndex,
    turnStartedAt: null,
    currentTurnBaseMs: 0,
    totals: zeroTotals(config.players),
    history: [],
    undoStack: [],
    startedAtWall: null,
    endedAtWall: null,
  }
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export function currentPlayer(state: GameState): Player | undefined {
  return state.config.players[state.currentIndex]
}

export function nextIndex(state: GameState): number {
  const n = state.config.players.length
  return n === 0 ? 0 : (state.currentIndex + 1) % n
}

/** ms elapsed on the current, in-progress turn (0 once ended). */
export function currentTurnMs(state: GameState, now: number): number {
  if (state.status === 'ended') return 0
  const live =
    state.status === 'running' && state.turnStartedAt != null
      ? Math.max(0, now - state.turnStartedAt)
      : 0
  return state.currentTurnBaseMs + live
}

/** Committed total for a player, plus their in-progress turn when they are on turn. */
export function playerTotalMs(state: GameState, playerId: string, now: number): number {
  const committed = state.totals[playerId] ?? 0
  const active = currentPlayer(state)
  if (active && active.id === playerId && state.status !== 'ended') {
    return committed + currentTurnMs(state, now)
  }
  return committed
}

export function isOvertime(state: GameState, now: number): boolean {
  return currentTurnMs(state, now) > state.config.maxTurnMs
}

/** How many turns the current player has already committed (their turn # is this + 1). */
export function currentTurnNumber(state: GameState): number {
  const active = currentPlayer(state)
  if (!active) return 0
  return state.history.filter((r) => r.playerId === active.id).length + 1
}

export function startGame(state: GameState, now: number): GameState {
  const startingPlayerIndex = clampIndex(
    state.config.startingPlayerIndex,
    state.config.players.length,
  )
  return {
    ...state,
    status: 'running',
    currentIndex: startingPlayerIndex,
    turnStartedAt: now,
    currentTurnBaseMs: 0,
    totals: zeroTotals(state.config.players),
    history: [],
    undoStack: [],
    startedAtWall: now,
    endedAtWall: null,
  }
}

function makeRecord(state: GameState, durationMs: number): TurnRecord {
  const active = currentPlayer(state)!
  return {
    playerId: active.id,
    durationMs,
    overtimeMs: Math.max(0, durationMs - state.config.maxTurnMs),
  }
}

/** Commit the current turn and advance to the next player. */
export function next(state: GameState, now: number): GameState {
  if (state.status !== 'running' && state.status !== 'paused') return state
  if (state.config.players.length === 0) return state
  const duration = currentTurnMs(state, now)
  const record = makeRecord(state, duration)
  return {
    ...state,
    totals: { ...state.totals, [record.playerId]: (state.totals[record.playerId] ?? 0) + duration },
    history: [...state.history, record],
    undoStack: [...state.undoStack, { type: 'next', prevIndex: state.currentIndex, record }],
    currentIndex: nextIndex(state),
    currentTurnBaseMs: 0,
    turnStartedAt: state.status === 'running' ? now : null,
  }
}

/** Skip the current player: discard their in-progress turn time and advance. */
export function skip(state: GameState, now: number): GameState {
  if (state.status !== 'running' && state.status !== 'paused') return state
  if (state.config.players.length === 0) return state
  const discardedMs = currentTurnMs(state, now)
  return {
    ...state,
    undoStack: [...state.undoStack, { type: 'skip', prevIndex: state.currentIndex, discardedMs }],
    currentIndex: nextIndex(state),
    currentTurnBaseMs: 0,
    turnStartedAt: state.status === 'running' ? now : null,
  }
}

/** Undo the most recent Next/Skip (misclick correction), resuming the previous player. */
export function prev(state: GameState, now: number): GameState {
  if (state.status !== 'running' && state.status !== 'paused') return state
  if (state.undoStack.length === 0) return state
  const entry = state.undoStack[state.undoStack.length - 1]
  const undoStack = state.undoStack.slice(0, -1)
  const turnStartedAt = state.status === 'running' ? now : null

  if (entry.type === 'next') {
    const idx = state.history.lastIndexOf(entry.record)
    const history =
      idx >= 0 ? [...state.history.slice(0, idx), ...state.history.slice(idx + 1)] : state.history
    return {
      ...state,
      totals: {
        ...state.totals,
        [entry.record.playerId]:
          (state.totals[entry.record.playerId] ?? 0) - entry.record.durationMs,
      },
      history,
      undoStack,
      currentIndex: entry.prevIndex,
      currentTurnBaseMs: entry.record.durationMs,
      turnStartedAt,
    }
  }

  // skip
  return {
    ...state,
    undoStack,
    currentIndex: entry.prevIndex,
    currentTurnBaseMs: entry.discardedMs,
    turnStartedAt,
  }
}

export function pause(state: GameState, now: number): GameState {
  if (state.status !== 'running') return state
  const live = state.turnStartedAt != null ? Math.max(0, now - state.turnStartedAt) : 0
  return {
    ...state,
    status: 'paused',
    currentTurnBaseMs: state.currentTurnBaseMs + live,
    turnStartedAt: null,
  }
}

export function resume(state: GameState, now: number): GameState {
  if (state.status !== 'paused') return state
  return { ...state, status: 'running', turnStartedAt: now }
}

/** End the game, committing the final in-progress turn (its time counts). */
export function endGame(state: GameState, now: number): GameState {
  if (state.status === 'ended' || state.status === 'setup') return state
  const duration = currentTurnMs(state, now)
  const record = makeRecord(state, duration)
  return {
    ...state,
    status: 'ended',
    totals: { ...state.totals, [record.playerId]: (state.totals[record.playerId] ?? 0) + duration },
    history: [...state.history, record],
    currentTurnBaseMs: 0,
    turnStartedAt: null,
    endedAtWall: now,
  }
}
