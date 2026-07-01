interface Props {
  paused: boolean
  canPrev: boolean
  onPrev: () => void
  onNext: () => void
  onSkip: () => void
  onPauseResume: () => void
  onEnd: () => void
}

export function Controls({ paused, canPrev, onPrev, onNext, onSkip, onPauseResume, onEnd }: Props) {
  return (
    <div className="controls">
      <div className="controls-main">
        <button
          className="btn btn-nav"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Previous player (undo)"
          title="Undo last Next"
        >
          <span aria-hidden>◀</span>
          <span className="btn-nav-label">Prev</span>
        </button>

        <button
          className={`btn btn-pause ${paused ? 'is-paused' : ''}`}
          onClick={onPauseResume}
          aria-label={paused ? 'Resume' : 'Pause'}
        >
          {paused ? '▶ Resume' : '❚❚ Pause'}
        </button>

        <button className="btn btn-nav btn-next" onClick={onNext} aria-label="Next player">
          <span className="btn-nav-label">Next</span>
          <span aria-hidden>▶</span>
        </button>
      </div>

      <div className="controls-secondary">
        <button className="btn btn-ghost" onClick={onSkip} aria-label="Skip this player's turn">
          ⤼ Skip
        </button>
        <button className="btn btn-danger" onClick={onEnd} aria-label="End game">
          ⏹ End game
        </button>
      </div>
    </div>
  )
}
