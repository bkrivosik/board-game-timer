import { useEffect, useMemo, useReducer } from 'react'
import type { GameConfig, GameState } from '../engine/types'
import {
  createInitialState,
  startGame,
  next,
  prev,
  skip,
  pause,
  resume,
  endGame,
} from '../engine/timer'
import { PALETTE, genId } from '../util/format'
import { loadState, saveState } from './persistence'

export function createDefaultConfig(): GameConfig {
  return {
    sessionName: '',
    maxTurnMs: 120_000,
    players: [
      { id: genId(), name: 'Player 1', color: PALETTE[0] },
      { id: genId(), name: 'Player 2', color: PALETTE[1] },
    ],
    startingPlayerIndex: 0,
  }
}

type Action =
  | { type: 'CONFIG'; config: GameConfig }
  | { type: 'START'; now: number }
  | { type: 'NEXT'; now: number }
  | { type: 'PREV'; now: number }
  | { type: 'SKIP'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'END'; now: number }
  | { type: 'NEW_GAME'; keepPlayers: boolean }

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'CONFIG':
      return state.status === 'setup' ? { ...state, config: action.config } : state
    case 'START':
      return startGame(state, action.now)
    case 'NEXT':
      return next(state, action.now)
    case 'PREV':
      return prev(state, action.now)
    case 'SKIP':
      return skip(state, action.now)
    case 'PAUSE':
      return pause(state, action.now)
    case 'RESUME':
      return resume(state, action.now)
    case 'END':
      return endGame(state, action.now)
    case 'NEW_GAME': {
      const config = action.keepPlayers
        ? { ...state.config, startingPlayerIndex: 0 }
        : createDefaultConfig()
      return createInitialState(config)
    }
    default:
      return state
  }
}

function init(): GameState {
  return loadState() ?? createInitialState(createDefaultConfig())
}

export interface GameActions {
  setConfig: (config: GameConfig) => void
  start: () => void
  next: () => void
  prev: () => void
  skip: () => void
  pause: () => void
  resume: () => void
  end: () => void
  newGame: (keepPlayers: boolean) => void
}

export function useGame(): { state: GameState; actions: GameActions } {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    saveState(state)
  }, [state])

  const actions = useMemo<GameActions>(
    () => ({
      setConfig: (config) => dispatch({ type: 'CONFIG', config }),
      start: () => dispatch({ type: 'START', now: Date.now() }),
      next: () => dispatch({ type: 'NEXT', now: Date.now() }),
      prev: () => dispatch({ type: 'PREV', now: Date.now() }),
      skip: () => dispatch({ type: 'SKIP', now: Date.now() }),
      pause: () => dispatch({ type: 'PAUSE', now: Date.now() }),
      resume: () => dispatch({ type: 'RESUME', now: Date.now() }),
      end: () => dispatch({ type: 'END', now: Date.now() }),
      newGame: (keepPlayers) => dispatch({ type: 'NEW_GAME', keepPlayers }),
    }),
    [],
  )

  return { state, actions }
}
