import { describe, it, expect } from 'vitest'
import {
  createInitialState,
  startGame,
  currentTurnMs,
  playerTotalMs,
  isOvertime,
  next,
  prev,
  skip,
  pause,
  resume,
  endGame,
  currentPlayer,
  currentTurnNumber,
} from './timer'
import type { GameConfig } from './types'

function cfg(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    sessionName: 'Test',
    maxTurnMs: 60_000,
    players: [
      { id: 'a', name: 'Alice', color: '#f00' },
      { id: 'b', name: 'Bob', color: '#0f0' },
      { id: 'c', name: 'Cara', color: '#00f' },
    ],
    startingPlayerIndex: 0,
    ...overrides,
  }
}

describe('startGame', () => {
  it('starts running at the configured starting player', () => {
    const s = startGame(createInitialState(cfg({ startingPlayerIndex: 1 })), 1000)
    expect(s.status).toBe('running')
    expect(s.currentIndex).toBe(1)
    expect(currentPlayer(s)?.id).toBe('b')
    expect(s.startedAtWall).toBe(1000)
  })
})

describe('currentTurnMs', () => {
  it('counts elapsed since turn start while running', () => {
    const s = startGame(createInitialState(cfg()), 1000)
    expect(currentTurnMs(s, 1000)).toBe(0)
    expect(currentTurnMs(s, 4000)).toBe(3000)
  })
})

describe('next', () => {
  it('commits duration, advances, and resets the turn', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 5000)
    expect(s.totals['a']).toBe(5000)
    expect(s.currentIndex).toBe(1)
    expect(currentTurnMs(s, 5000)).toBe(0)
    expect(s.history).toHaveLength(1)
    expect(s.history[0]).toMatchObject({ playerId: 'a', durationMs: 5000, overtimeMs: 0 })
  })

  it('records overtime past the max', () => {
    let s = startGame(createInitialState(cfg({ maxTurnMs: 3000 })), 0)
    s = next(s, 5000)
    expect(s.history[0].overtimeMs).toBe(2000)
  })

  it('wraps around the player order', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 1000)
    s = next(s, 2000)
    s = next(s, 3000)
    expect(s.currentIndex).toBe(0)
  })
})

describe('prev (undo last next)', () => {
  it('restores the previous player, rolls back their total, and resumes their timer', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 5000)
    expect(s.totals['a']).toBe(5000)
    s = prev(s, 6000)
    expect(s.currentIndex).toBe(0)
    expect(s.totals['a']).toBe(0)
    expect(s.history).toHaveLength(0)
    expect(currentTurnMs(s, 6000)).toBe(5000)
    expect(currentTurnMs(s, 6500)).toBe(5500)
  })

  it('is a no-op at the very first turn', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = prev(s, 1000)
    expect(s.currentIndex).toBe(0)
    expect(s.history).toHaveLength(0)
  })

  it('undoes multiple nexts one at a time', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 1000)
    s = next(s, 3000)
    expect(s.currentIndex).toBe(2)
    s = prev(s, 4000)
    expect(s.currentIndex).toBe(1)
    expect(s.totals['b']).toBe(0)
    expect(currentTurnMs(s, 4000)).toBe(2000)
    s = prev(s, 5000)
    expect(s.currentIndex).toBe(0)
    expect(s.totals['a']).toBe(0)
    expect(currentTurnMs(s, 5000)).toBe(1000)
  })
})

describe('skip', () => {
  it('discards in-progress time and advances without recording a turn', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = skip(s, 4000)
    expect(s.currentIndex).toBe(1)
    expect(s.totals['a']).toBe(0)
    expect(s.history).toHaveLength(0)
  })

  it('can be undone by prev, restoring the discarded time', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = skip(s, 4000)
    s = prev(s, 5000)
    expect(s.currentIndex).toBe(0)
    expect(currentTurnMs(s, 5000)).toBe(4000)
  })
})

describe('pause / resume', () => {
  it('freezes elapsed while paused and continues after resume', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = pause(s, 3000)
    expect(s.status).toBe('paused')
    expect(currentTurnMs(s, 9999)).toBe(3000)
    s = resume(s, 10_000)
    expect(s.status).toBe('running')
    expect(currentTurnMs(s, 12_000)).toBe(5000)
  })

  it('Next while paused commits only pre-pause time and auto-resumes the new player', () => {
    // Alice thinks 10s, then we pause.
    let s = startGame(createInitialState(cfg()), 0)
    s = pause(s, 10_000)
    expect(s.status).toBe('paused')

    // We sit paused for 30s (real time advances to 40s) and then hit Next.
    s = next(s, 40_000)

    // Alice is credited exactly her 10s — the 30s paused gap is NOT counted.
    expect(s.totals['a']).toBe(10_000)
    expect(s.history[0]).toMatchObject({ playerId: 'a', durationMs: 10_000 })

    // Bob is now the active player, starting from a fresh 0.
    expect(s.currentIndex).toBe(1)
    expect(currentPlayer(s)?.id).toBe('b')
    expect(s.currentTurnBaseMs).toBe(0)

    // Advancing resumes play: the game is running and Bob's clock starts now.
    expect(s.status).toBe('running')
    expect(s.turnStartedAt).toBe(40_000)
    expect(currentTurnMs(s, 43_000)).toBe(3000)
    expect(playerTotalMs(s, 'b', 43_000)).toBe(3000)
    expect(playerTotalMs(s, 'a', 43_000)).toBe(10_000)
  })

  it('Skip while paused discards time and auto-resumes the new player', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = pause(s, 10_000)
    s = skip(s, 40_000)

    // Skipped player accrues nothing; game resumes on the next player.
    expect(s.totals['a']).toBe(0)
    expect(s.currentIndex).toBe(1)
    expect(s.status).toBe('running')
    expect(currentTurnMs(s, 42_000)).toBe(2000)
  })
})

describe('playerTotalMs', () => {
  it('includes the in-progress turn for the active player only', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 5000)
    expect(playerTotalMs(s, 'a', 8000)).toBe(5000)
    expect(playerTotalMs(s, 'b', 8000)).toBe(3000)
  })
})

describe('isOvertime / currentTurnNumber', () => {
  it('flags overtime once past the max', () => {
    const s = startGame(createInitialState(cfg({ maxTurnMs: 2000 })), 0)
    expect(isOvertime(s, 1000)).toBe(false)
    expect(isOvertime(s, 3000)).toBe(true)
  })

  it('counts the active player turn number', () => {
    let s = startGame(createInitialState(cfg()), 0)
    expect(currentTurnNumber(s)).toBe(1)
    s = next(s, 1000)
    s = next(s, 2000)
    s = next(s, 3000)
    expect(currentTurnNumber(s)).toBe(2)
  })
})

describe('endGame', () => {
  it('commits the final in-progress turn and marks ended', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 4000)
    s = endGame(s, 10_000)
    expect(s.status).toBe('ended')
    expect(s.totals['b']).toBe(6000)
    expect(s.history).toHaveLength(2)
    expect(currentTurnMs(s, 99_999)).toBe(0)
  })
})
