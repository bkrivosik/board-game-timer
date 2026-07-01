import { useMemo, useState } from 'react'
import type { GameState } from '../engine/types'
import type { GameActions } from '../state/useGame'
import { computeStats } from '../engine/stats'
import { formatMs, formatPercent } from '../util/format'
import { PieChart } from './PieChart'
import { buildStatsText, copyToClipboard } from '../export/exportText'
import { exportStatsImage } from '../export/exportImage'

interface Props {
  state: GameState
  actions: GameActions
}

export function StatsView({ state, actions }: Props) {
  const stats = useMemo(
    () => computeStats(state, state.endedAtWall ?? Date.now()),
    [state],
  )
  const [copied, setCopied] = useState(false)
  const [imgBusy, setImgBusy] = useState(false)

  const ranked = [...stats.players].sort((a, b) => b.totalMs - a.totalMs)
  const pieData = stats.players.map((p) => ({
    id: p.player.id,
    label: p.player.name,
    color: p.player.color,
    value: p.totalMs,
  }))

  const onCopy = async () => {
    const ok = await copyToClipboard(buildStatsText(stats))
    setCopied(ok)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSaveImage = async () => {
    setImgBusy(true)
    try {
      await exportStatsImage(stats)
    } finally {
      setImgBusy(false)
    }
  }

  return (
    <div className="view stats">
      <header className="app-header">
        <h1>{stats.sessionName.trim() || 'Results'}</h1>
        <p className="subtitle">Final statistics</p>
      </header>

      <div className="stats-summary">
        <div className="summary-item">
          <span>Total time</span>
          <strong>{formatMs(stats.totalElapsedMs)}</strong>
        </div>
        <div className="summary-item">
          <span>Think time</span>
          <strong>{formatMs(stats.totalTurnMs)}</strong>
        </div>
        {stats.fastest && (
          <div className="summary-item">
            <span>Fastest avg</span>
            <strong>{stats.fastest.player.name}</strong>
          </div>
        )}
        {stats.slowest && (
          <div className="summary-item">
            <span>Slowest avg</span>
            <strong>{stats.slowest.player.name}</strong>
          </div>
        )}
      </div>

      <div className="stats-pie">
        <PieChart data={pieData} size={220} />
      </div>

      <ol className="stats-list">
        {ranked.map((p, i) => (
          <li key={p.player.id} className="stats-row">
            <span className="rank">{i + 1}</span>
            <span className="legend-dot" style={{ background: p.player.color }} />
            <div className="stats-row-main">
              <div className="stats-row-top">
                <span className="p-name">{p.player.name}</span>
                <span className="p-total">
                  {formatMs(p.totalMs)} <em>{formatPercent(p.percent)}</em>
                </span>
              </div>
              <div className="stats-row-sub">
                turns {p.turns} · avg {formatMs(p.avgMs)} · longest {formatMs(p.longestMs)}
                {p.overtimeTurns > 0 && (
                  <>
                    {' · '}
                    <span className="ot">
                      overtime {p.overtimeTurns} ({formatMs(p.overtimeMs)})
                    </span>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="stats-actions">
        <button className="btn btn-primary" onClick={onSaveImage} disabled={imgBusy}>
          {imgBusy ? 'Preparing…' : '📷 Save image'}
        </button>
        <button className="btn btn-ghost" onClick={onCopy}>
          {copied ? '✓ Copied' : '⧉ Copy text'}
        </button>
      </div>
      <div className="stats-actions">
        <button className="btn btn-ghost" onClick={() => actions.newGame(true)}>
          ↻ Same players
        </button>
        <button className="btn btn-ghost" onClick={() => actions.newGame(false)}>
          ＋ New players
        </button>
      </div>
    </div>
  )
}
