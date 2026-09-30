// Best-effort in-memory sliding-window limiter. On serverless it only protects
// per warm instance — it raises the cost of naive spam, it is not a hard guarantee.

export interface RateLimiter {
  isLimited(key: string): boolean
  record(key: string): void
}

interface RateLimiterOptions {
  max: number
  windowMs: number
  now?: () => number
}

// Above this many tracked keys, expired entries are swept so memory stays bounded.
const SWEEP_THRESHOLD = 1000

export function createRateLimiter({ max, windowMs, now = Date.now }: RateLimiterOptions): RateLimiter {
  const hits = new Map<string, number[]>()

  function recent(key: string): number[] {
    const cutoff = now() - windowMs
    const live = (hits.get(key) ?? []).filter((t) => t > cutoff)
    if (live.length > 0) hits.set(key, live)
    else hits.delete(key)
    return live
  }

  return {
    isLimited(key) {
      return recent(key).length >= max
    },
    record(key) {
      if (hits.size > SWEEP_THRESHOLD) {
        for (const k of Array.from(hits.keys())) recent(k)
      }
      hits.set(key, [...recent(key), now()])
    },
  }
}

/** First entry of an `x-forwarded-for` header, or null when absent/empty. */
export function firstForwardedIp(header: string | null): string | null {
  const first = header?.split(',')[0]?.trim()
  return first || null
}
