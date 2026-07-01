import { useEffect } from 'react'

// The Screen Wake Lock API isn't in every lib.dom version; keep it loosely typed.
interface WakeLockLike {
  release: () => Promise<void>
}

/**
 * Holds a screen wake lock while `active` is true so the device doesn't sleep
 * during play. Re-acquires when the tab becomes visible again (locks are
 * released automatically on tab switch). Silently no-ops where unsupported.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    let sentinel: WakeLockLike | null = null
    let cancelled = false

    const wakeLock = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<WakeLockLike> } })
      .wakeLock

    async function acquire() {
      if (!wakeLock) return
      try {
        const s = await wakeLock.request('screen')
        if (cancelled) {
          s.release().catch(() => {})
        } else {
          sentinel = s
        }
      } catch {
        // user denied / not allowed (e.g. tab not focused) — ignore
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
