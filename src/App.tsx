import { useEffect, useRef } from 'react'
import type { GameState } from './engine/types'
import { useGame } from './state/useGame'
import { useNow } from './hooks/useNow'
import { useWakeLock } from './hooks/useWakeLock'
import { saveFrozen } from './state/persistence'
import { SetupView } from './components/SetupView'
import { PlayView } from './components/PlayView'
import { StatsView } from './components/StatsView'

export default function App() {
  const { state, actions } = useGame()
  const running = state.status === 'running'
  const now = useNow(running)
  useWakeLock(running)

  // Freeze the in-progress turn to storage when the tab is hidden/closed so a
  // mid-turn refresh resumes (paused) without losing elapsed time.
  const stateRef = useRef<GameState>(state)
  stateRef.current = state
  useEffect(() => {
    const freeze = () => saveFrozen(stateRef.current, Date.now())
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') freeze()
    }
    window.addEventListener('pagehide', freeze)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', freeze)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <main className="app">
      {state.status === 'setup' && (
        <SetupView config={state.config} onChange={actions.setConfig} onStart={actions.start} />
      )}
      {(state.status === 'running' || state.status === 'paused') && (
        <PlayView state={state} now={now} actions={actions} />
      )}
      {state.status === 'ended' && <StatsView state={state} actions={actions} />}
    </main>
  )
}
