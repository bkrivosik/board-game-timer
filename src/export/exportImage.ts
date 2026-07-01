import type { GameStats } from '../engine/stats'
import { formatMs, formatPercent } from '../util/format'
import { computeSlices } from '../util/pie'

/**
 * Render a shareable stats card to PNG. Uses the Web Share API with a file when
 * available (mobile), otherwise triggers a download.
 */
export async function exportStatsImage(stats: GameStats): Promise<void> {
  const canvas = renderStatsCanvas(stats)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return

  const base = stats.sessionName.trim() || 'game-timer'
  const fileName = `${base.replace(/[^\w-]+/g, '-').toLowerCase()}-stats.png`

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }
  const file = new File([blob], fileName, { type: 'image/png' })
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'Game stats' })
      return
    } catch {
      // user cancelled or share failed — fall back to download
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function renderStatsCanvas(stats: GameStats): HTMLCanvasElement {
  const ranked = [...stats.players].sort((a, b) => b.totalMs - a.totalMs)

  const W = 720
  const headerH = 140
  const pieSize = 260
  const rowH = 52
  const rowsTop = headerH + 24
  const bodyH = Math.max(pieSize, ranked.length * rowH)
  const H = rowsTop + bodyH + 48

  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const canvas = document.createElement('canvas')
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#f8fafc'
  ctx.font = '700 34px system-ui, -apple-system, sans-serif'
  ctx.fillText(stats.sessionName.trim() || 'Board Game Timer', 40, 58)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '400 18px system-ui, -apple-system, sans-serif'
  ctx.fillText(
    `Total ${formatMs(stats.totalElapsedMs)}  ·  Think ${formatMs(stats.totalTurnMs)}`,
    40,
    90,
  )
  if (stats.fastest && stats.slowest) {
    ctx.fillText(
      `Fastest ${stats.fastest.player.name}  ·  Slowest ${stats.slowest.player.name}`,
      40,
      116,
    )
  }

  // Pie (left)
  const cx = 40 + pieSize / 2
  const cy = rowsTop + pieSize / 2
  const r = pieSize / 2
  const { slices, total } = computeSlices(
    stats.players.map((p) => ({
      id: p.player.id,
      label: p.player.name,
      color: p.player.color,
      value: p.totalMs,
    })),
  )
  const nonzero = slices.filter((s) => s.value > 0)
  if (total === 0) {
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  } else if (nonzero.length === 1) {
    ctx.fillStyle = nonzero[0].color
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  } else {
    for (const s of slices) {
      if (s.value <= 0) continue
      const a0 = ((s.startAngle - 90) * Math.PI) / 180
      const a1 = ((s.endAngle - 90) * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, a0, a1)
      ctx.closePath()
      ctx.fillStyle = s.color
      ctx.fill()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Rows (right)
  const rx = 40 + pieSize + 44
  const right = W - 40
  ctx.textBaseline = 'middle'
  ranked.forEach((p, i) => {
    const rowCy = rowsTop + i * rowH + rowH / 2

    ctx.fillStyle = p.player.color
    ctx.beginPath()
    ctx.arc(rx + 8, rowCy - 8, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f8fafc'
    ctx.font = '600 20px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(p.player.name, rx + 28, rowCy - 8)

    ctx.fillStyle = '#e2e8f0'
    ctx.textAlign = 'right'
    ctx.fillText(`${formatMs(p.totalMs)} (${formatPercent(p.percent)})`, right, rowCy - 8)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '400 15px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    const ot = p.overtimeTurns > 0 ? `  ·  OT ${p.overtimeTurns}` : ''
    ctx.fillText(
      `turns ${p.turns}  ·  avg ${formatMs(p.avgMs)}  ·  longest ${formatMs(p.longestMs)}${ot}`,
      rx + 28,
      rowCy + 13,
    )
  })

  // Footer
  ctx.textAlign = 'left'
  ctx.fillStyle = '#475569'
  ctx.font = '400 13px system-ui, -apple-system, sans-serif'
  ctx.fillText('Made with Board Game Timer', 40, H - 22)

  return canvas
}
