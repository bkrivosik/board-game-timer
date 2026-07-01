import type { GameState, Player } from './types'

export interface PlayerStats {
  player: Player
  totalMs: number
  turns: number
  avgMs: number
  longestMs: number
  overtimeTurns: number
  overtimeMs: number
  /** Percentage of total committed think-time (0..100). */
  percent: number
}

export interface GameStats {
  sessionName: string
  players: PlayerStats[]
  /** Sum of every committed turn's duration. */
  totalTurnMs: number
  /** Wall-clock span from start to end (or `now` if not ended). */
  totalElapsedMs: number
  /** Player with the lowest average turn time (only counting players with >=1 turn). */
  fastest: PlayerStats | null
  /** Player with the highest average turn time. */
  slowest: PlayerStats | null
}

/**
 * Derive end-of-game statistics from committed history. Works at any time, but is
 * intended to be read once the game has ended.
 */
export function computeStats(state: GameState, now: number): GameStats {
  const totalTurnMs = state.history.reduce((sum, r) => sum + r.durationMs, 0)

  const players: PlayerStats[] = state.config.players.map((player) => {
    const records = state.history.filter((r) => r.playerId === player.id)
    const totalMs = records.reduce((sum, r) => sum + r.durationMs, 0)
    const turns = records.length
    const longestMs = records.reduce((max, r) => Math.max(max, r.durationMs), 0)
    const overtimeTurns = records.filter((r) => r.overtimeMs > 0).length
    const overtimeMs = records.reduce((sum, r) => sum + r.overtimeMs, 0)
    return {
      player,
      totalMs,
      turns,
      avgMs: turns > 0 ? totalMs / turns : 0,
      longestMs,
      overtimeTurns,
      overtimeMs,
      percent: totalTurnMs > 0 ? (totalMs / totalTurnMs) * 100 : 0,
    }
  })

  const withTurns = players.filter((p) => p.turns > 0)
  let fastest: PlayerStats | null = null
  let slowest: PlayerStats | null = null
  for (const p of withTurns) {
    if (!fastest || p.avgMs < fastest.avgMs) fastest = p
    if (!slowest || p.avgMs > slowest.avgMs) slowest = p
  }

  const startedAt = state.startedAtWall
  const endedAt = state.endedAtWall ?? now
  const totalElapsedMs = startedAt != null ? Math.max(0, endedAt - startedAt) : 0

  return {
    sessionName: state.config.sessionName,
    players,
    totalTurnMs,
    totalElapsedMs,
    fastest,
    slowest,
  }
}
