import { computeSlices, slicePath, type PieDatum } from '../util/pie'

interface Props {
  data: PieDatum[]
  size?: number
}

/** Time-distribution pie, hand-rolled as SVG (no chart dependency). */
export function PieChart({ data, size = 200 }: Props) {
  const { slices, total } = computeSlices(data)
  const r = size / 2
  const cx = r
  const cy = r
  const nonzero = slices.filter((s) => s.value > 0)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Time distribution per player"
      className="pie"
    >
      {total === 0 ? (
        <circle
          cx={cx}
          cy={cy}
          r={r - 2}
          fill="none"
          stroke="#334155"
          strokeWidth={2}
          strokeDasharray="5 6"
        />
      ) : nonzero.length === 1 ? (
        <circle cx={cx} cy={cy} r={r} fill={nonzero[0].color} />
      ) : (
        slices.map((s) =>
          s.value > 0 ? (
            <path
              key={s.id}
              d={slicePath(cx, cy, r, s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="#0f172a"
              strokeWidth={1.5}
            />
          ) : null,
        )
      )}
    </svg>
  )
}
