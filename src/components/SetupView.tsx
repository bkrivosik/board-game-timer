import { useState } from 'react'
import type { GameConfig, Player } from '../engine/types'
import { PALETTE, nextColor, genId } from '../util/format'

interface Props {
  config: GameConfig
  onChange: (config: GameConfig) => void
  onStart: () => void
}

const MAX_PLAYERS = 10

export function SetupView({ config, onChange, onStart }: Props) {
  const [openColorFor, setOpenColorFor] = useState<string | null>(null)

  const { players } = config
  const minutes = Math.floor(config.maxTurnMs / 60_000)
  const seconds = Math.floor((config.maxTurnMs % 60_000) / 1000)

  const setPlayers = (nextPlayers: Player[]) => {
    const startingPlayerIndex = Math.min(
      config.startingPlayerIndex,
      Math.max(0, nextPlayers.length - 1),
    )
    onChange({ ...config, players: nextPlayers, startingPlayerIndex })
  }

  const updatePlayer = (id: string, patch: Partial<Player>) =>
    setPlayers(players.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) return
    const used = players.map((p) => p.color)
    setPlayers([
      ...players,
      { id: genId(), name: `Player ${players.length + 1}`, color: nextColor(used) },
    ])
  }

  const removePlayer = (id: string) => {
    if (players.length <= 2) return
    setPlayers(players.filter((p) => p.id !== id))
  }

  const movePlayer = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= players.length) return
    const copy = players.slice()
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    setPlayers(copy)
  }

  const setMax = (mins: number, secs: number) => {
    const m = Math.max(0, Math.min(180, Math.floor(mins || 0)))
    const s = Math.max(0, Math.min(59, Math.floor(secs || 0)))
    onChange({ ...config, maxTurnMs: (m * 60 + s) * 1000 })
  }

  const randomizeStart = () => {
    const idx = Math.floor(Math.random() * players.length)
    onChange({ ...config, startingPlayerIndex: idx })
  }

  const names = players.map((p) => p.name.trim())
  const hasEmpty = names.some((n) => n.length === 0)
  const validMax = config.maxTurnMs > 0
  const canStart = players.length >= 2 && !hasEmpty && validMax
  const error = !validMax
    ? 'Set a max turn time greater than zero.'
    : hasEmpty
      ? 'Every player needs a name.'
      : players.length < 2
        ? 'Add at least two players.'
        : ''

  return (
    <div className="view setup">
      <header className="app-header">
        <h1>Board Game Timer</h1>
        <p className="subtitle">Track each player's thinking time.</p>
      </header>

      <label className="field">
        <span className="field-label">Session name (optional)</span>
        <input
          type="text"
          value={config.sessionName}
          placeholder="e.g. Catan — Friday"
          onChange={(e) => onChange({ ...config, sessionName: e.target.value })}
        />
      </label>

      <div className="field">
        <span className="field-label">Max desired time per turn</span>
        <div className="time-inputs">
          <label>
            <input
              type="number"
              min={0}
              max={180}
              value={minutes}
              onChange={(e) => setMax(Number(e.target.value), seconds)}
              aria-label="Minutes"
            />
            <span>min</span>
          </label>
          <label>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setMax(minutes, Number(e.target.value))}
              aria-label="Seconds"
            />
            <span>sec</span>
          </label>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Players</span>
        <ul className="players">
          {players.map((p, i) => (
            <li key={p.id} className="player-row">
              <div className="swatch-wrap">
                <button
                  type="button"
                  className="swatch"
                  style={{ background: p.color }}
                  aria-label={`Change colour for ${p.name || 'player'}`}
                  onClick={() => setOpenColorFor(openColorFor === p.id ? null : p.id)}
                />
                {openColorFor === p.id && (
                  <div className="palette" role="listbox" aria-label="Choose colour">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="palette-dot"
                        style={{ background: c }}
                        aria-label={c}
                        onClick={() => {
                          updatePlayer(p.id, { color: c })
                          setOpenColorFor(null)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <input
                className="player-name"
                type="text"
                value={p.name}
                placeholder={`Player ${i + 1}`}
                onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
              />

              <div className="row-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => movePlayer(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => movePlayer(i, 1)}
                  disabled={i === players.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 2}
                  aria-label={`Remove ${p.name || 'player'}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-ghost add-player"
          onClick={addPlayer}
          disabled={players.length >= MAX_PLAYERS}
        >
          + Add player
        </button>
      </div>

      <div className="field">
        <span className="field-label">Starting player</span>
        <div className="start-picker">
          <select
            value={config.startingPlayerIndex}
            onChange={(e) => onChange({ ...config, startingPlayerIndex: Number(e.target.value) })}
          >
            {players.map((p, i) => (
              <option key={p.id} value={i}>
                {p.name.trim() || `Player ${i + 1}`}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={randomizeStart}>
            🎲 Random
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn btn-primary btn-start" onClick={onStart} disabled={!canStart}>
        Start game ▶
      </button>
    </div>
  )
}
