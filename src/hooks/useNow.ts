import { useEffect, useState } from 'react'

/**
 * Returns a `now` timestamp that ticks while `active` is true, so time displays
 * re-render. 250ms is smooth enough for mm:ss and the overtime colour flip
 * without the cost of a per-frame update.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [active, intervalMs])

  return now
}
