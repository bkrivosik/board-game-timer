export interface Player {
  id: string
  name: string
  color: string
}

export interface GameConfig {
  sessionName: string
  /** Global desired max time per turn, in ms. Going over is allowed but flagged. */
  maxTurnMs: number
  /** Players in turn order. */
  players: Player[]
  /** Index into `players` of who takes the first turn. */
  startingPlayerIndex: number
}

export type GameStatus = 'setup' | 'running' | 'paused' | 'ended'

/** A completed turn, recorded when a turn is committed (Next / End). */
export interface TurnRecord {
  playerId: string
  durationMs: number
  /** max(0, durationMs - maxTurnMs) captured at commit time. */
  overtimeMs: number
}

/** Entries pushed on Next/Skip so Prev can precisely undo the last action. */
export type UndoEntry =
  | { type: 'next'; prevIndex: number; record: TurnRecord }
  | { type: 'skip'; prevIndex: number; discardedMs: number }

export interface GameState {
  config: GameConfig
  status: GameStatus
  /** Index into config.players of the player currently on turn. */
  currentIndex: number
  /** Timestamp when the current running segment started; null while paused/ended. */
  turnStartedAt: number | null
  /** Accumulated ms for the current turn from segments before `turnStartedAt`. */
  currentTurnBaseMs: number
  /** Committed total ms per player id (excludes the in-progress turn). */
  totals: Record<string, number>
  /** Committed turns, in commit order. */
  history: TurnRecord[]
  undoStack: UndoEntry[]
  /** Wall-clock ms when the game started; null before start. */
  startedAtWall: number | null
  /** Wall-clock ms when the game ended; null until ended. */
  endedAtWall: number | null
}
