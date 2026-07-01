export interface PieDatum {
  id: string
  label: string
  color: string
  value: number
}

export interface PieSlice extends PieDatum {
  startAngle: number
  endAngle: number
  percent: number
}

/** Turn raw values into clockwise slices (angles in degrees, 0 = top). */
export function computeSlices(data: PieDatum[]): { slices: PieSlice[]; total: number } {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  let angle = 0
  const slices = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0
    const startAngle = angle
    const endAngle = angle + frac * 360
    angle = endAngle
    return { ...d, startAngle, endAngle, percent: frac * 100 }
  })
  return { slices, total }
}

export function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/** SVG path for a pie slice from startAngle to endAngle (clockwise). */
export function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const [sx, sy] = polar(cx, cy, r, startAngle)
  const [ex, ey] = polar(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey} Z`
}
