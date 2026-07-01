/** Format milliseconds as m:ss (or h:mm:ss past an hour). */
export function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

/** One decimal percentage, e.g. "42.5%". */
export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`
}

/** Distinct, reasonably colour-blind-friendly palette for player colours. */
export const PALETTE = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#e11d48', // rose
  '#8b5cf6', // violet
]

/** Pick the first palette colour not already used; falls back to cycling. */
export function nextColor(used: string[]): string {
  const free = PALETTE.find((c) => !used.includes(c))
  if (free) return free
  return PALETTE[used.length % PALETTE.length]
}

export function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'p' + Math.random().toString(36).slice(2, 10)
}
