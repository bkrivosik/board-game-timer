import { useState, type CSSProperties } from 'react'
import type { GameState } from '../engine/types'
import type { GameActions } from '../state/useGame'
import {
  currentPlayer,
  currentTurnMs,
  playerTotalMs,
  isOvertime,
  currentTurnNumber,
  nextIndex,
} from '../engine/timer'
import { formatMs } from '../util/format'
import { PieChart } from './PieChart'
import { Controls } from './Controls'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  state: GameState
  now: number
  actions: GameActions
}

export function PlayView({ state, now, actions }: Props) {
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const player = currentPlayer(state)
  if (!player) return null

  const paused = state.status === 'paused'
  const turnMs = currentTurnMs(state, now)
  const totalMs = playerTotalMs(state, player.id, now)
  const over = isOvertime(state, now)
  const turnNo = currentTurnNumber(state)
  const upNext = state.config.players[nextIndex(state)]

  const pieData = state.config.players.map((p) => ({
    id: p.id,
    label: p.name,
    color: p.color,
    value: state.totals[p.id] ?? 0,
  }))

  const accentStyle = { '--accent': player.color } as CSSProperties

  return (
    <div className="view play" style={accentStyle}>
      <div className={`turn-card${over ? ' is-over' : ''}${paused ? ' is-paused' : ''}`}>
        <div className="turn-meta">
          <span className="turn-index">Turn {turnNo}</span>
          {state.config.sessionName.trim() && (
            <span className="session">{state.config.sessionName}</span>
          )}
        </div>
        <div className="player-name-big">{player.name}</div>
        <div className={`turn-timer${over ? ' over' : ''}`}>{formatMs(turnMs)}</div>
        <div className="turn-sub">
          <span>total {formatMs(totalMs)}</span>
          <span className="dot">•</span>
          <span>max {formatMs(state.config.maxTurnMs)}</span>
        </div>
        <div className="badges">
          {over && <span className="badge over-badge">over time</span>}
          {paused && <span className="badge paused-badge">paused</span>}
        </div>
      </div>

      <div className="next-up">
        Next: <strong>{upNext.name}</strong>
      </div>

      <div className="pie-wrap">
        <PieChart data={pieData} size={190} />
        <ul className="legend">
          {state.config.players.map((p) => (
            <li key={p.id} className={p.id === player.id ? 'active' : ''}>
              <span className="legend-dot" style={{ background: p.color }} />
              <span className="legend-name">{p.name}</span>
              <span className="legend-time">{formatMs(playerTotalMs(state, p.id, now))}</span>
            </li>
          ))}
        </ul>
      </div>

      <Controls
        paused={paused}
        canPrev={state.undoStack.length > 0}
        onPrev={actions.prev}
        onNext={actions.next}
        onSkip={actions.skip}
        onPauseResume={paused ? actions.resume : actions.pause}
        onEnd={() => setConfirmingEnd(true)}
      />

      {confirmingEnd && (
        <ConfirmDialog
          title="End game?"
          message="This finishes the game and shows the final statistics. You can't return to the current game afterwards."
          confirmLabel="End game"
          cancelLabel="Keep playing"
          danger
          onConfirm={() => {
            setConfirmingEnd(false)
            actions.end()
          }}
          onCancel={() => setConfirmingEnd(false)}
        />
      )}
    </div>
  )
}
