import type { GameStats } from '../engine/stats'
import { formatMs, formatPercent } from '../util/format'

/** Human-readable, copyable summary of the finished game. */
export function buildStatsText(stats: GameStats): string {
  const title = stats.sessionName.trim() || 'Board Game Timer'
  const lines: string[] = [title, '='.repeat(title.length)]
  lines.push(`Total game time: ${formatMs(stats.totalElapsedMs)}`)
  lines.push(`Total think time: ${formatMs(stats.totalTurnMs)}`)
  if (stats.fastest) {
    lines.push(`Fastest avg: ${stats.fastest.player.name} (${formatMs(stats.fastest.avgMs)}/turn)`)
  }
  if (stats.slowest) {
    lines.push(`Slowest avg: ${stats.slowest.player.name} (${formatMs(stats.slowest.avgMs)}/turn)`)
  }
  lines.push('')

  const ranked = [...stats.players].sort((a, b) => b.totalMs - a.totalMs)
  ranked.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.player.name} — ${formatMs(p.totalMs)} (${formatPercent(p.percent)})`)
    const ot = p.overtimeTurns > 0 ? ` · overtime ${p.overtimeTurns} (${formatMs(p.overtimeMs)})` : ''
    lines.push(
      `   turns ${p.turns} · avg ${formatMs(p.avgMs)} · longest ${formatMs(p.longestMs)}${ot}`,
    )
  })

  return lines.join('\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
