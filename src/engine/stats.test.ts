import { describe, it, expect } from 'vitest'
import { createInitialState, startGame, next, endGame } from './timer'
import { computeStats } from './stats'
import type { GameConfig } from './types'

function cfg(): GameConfig {
  return {
    sessionName: 'Game Night',
    maxTurnMs: 3000,
    players: [
      { id: 'a', name: 'Alice', color: '#f00' },
      { id: 'b', name: 'Bob', color: '#0f0' },
    ],
    startingPlayerIndex: 0,
  }
}

describe('computeStats', () => {
  it('aggregates totals, turns, avg, longest, overtime and percent', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 2000) // Alice turn 1: 2s
    s = next(s, 7000) // Bob turn 1: 5s (2s overtime)
    s = next(s, 11_000) // Alice turn 2: 4s (1s overtime)
    s = endGame(s, 12_000) // Bob turn 2: 1s

    const stats = computeStats(s, 12_000)
    const a = stats.players.find((p) => p.player.id === 'a')!
    const b = stats.players.find((p) => p.player.id === 'b')!

    expect(a.totalMs).toBe(6000)
    expect(a.turns).toBe(2)
    expect(a.avgMs).toBe(3000)
    expect(a.longestMs).toBe(4000)
    expect(a.overtimeTurns).toBe(1)
    expect(a.overtimeMs).toBe(1000)

    expect(b.totalMs).toBe(6000)
    expect(b.turns).toBe(2)
    expect(b.longestMs).toBe(5000)
    expect(b.overtimeTurns).toBe(1)
    expect(b.overtimeMs).toBe(2000)

    expect(stats.totalTurnMs).toBe(12_000)
    expect(a.percent).toBeCloseTo(50)
    expect(b.percent).toBeCloseTo(50)
    expect(stats.totalElapsedMs).toBe(12_000)
  })

  it('picks fastest/slowest by average turn time', () => {
    let s = startGame(createInitialState(cfg()), 0)
    s = next(s, 1000) // Alice avg 1s
    s = endGame(s, 6000) // Bob 5s
    const stats = computeStats(s, 6000)
    expect(stats.fastest?.player.id).toBe('a')
    expect(stats.slowest?.player.id).toBe('b')
  })
})
