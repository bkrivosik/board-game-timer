import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { SetupView } from './SetupView'
import { PlayView } from './PlayView'
import { StatsView } from './StatsView'
import { createInitialState, startGame, next, endGame } from '../engine/timer'
import type { GameConfig } from '../engine/types'
import type { GameActions } from '../state/useGame'

const noopActions: GameActions = {
  setConfig: () => {},
  start: () => {},
  next: () => {},
  prev: () => {},
  skip: () => {},
  pause: () => {},
  resume: () => {},
  end: () => {},
  newGame: () => {},
}

function cfg(): GameConfig {
  return {
    sessionName: 'Catan',
    maxTurnMs: 60_000,
    players: [
      { id: 'a', name: 'Alice', color: '#ef4444' },
      { id: 'b', name: 'Bob', color: '#3b82f6' },
    ],
    startingPlayerIndex: 0,
  }
}

// These render the components to string, which executes their render logic and
// throws on any runtime error (bad hook, undefined access, etc.).
describe('view rendering', () => {
  it('renders SetupView with the players', () => {
    const html = renderToString(
      <SetupView config={cfg()} onChange={() => {}} onStart={() => {}} />,
    )
    expect(html).toContain('Start game')
    expect(html).toContain('Max desired time per turn')
  })

  it('renders PlayView mid-game (with overtime) without crashing', () => {
    let state = startGame(createInitialState(cfg()), 0)
    state = next(state, 5000) // Alice committed 5s; Bob now active
    const html = renderToString(<PlayView state={state} now={70_000} actions={noopActions} />)
    expect(html).toContain('Bob') // active player
    expect(html).toContain('Next:')
    expect(html).toContain('over time') // 70s > 60s max → overtime badge
  })

  it('renders StatsView after the game ends', () => {
    let state = startGame(createInitialState(cfg()), 0)
    state = next(state, 5000)
    state = endGame(state, 12_000)
    const html = renderToString(<StatsView state={state} actions={noopActions} />)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
    expect(html).toContain('Save image')
    expect(html).toContain('%')
  })
})
