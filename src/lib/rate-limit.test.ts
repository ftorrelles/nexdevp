import { describe, it, expect } from 'vitest'
import { createRateLimiter, firstForwardedIp } from './rate-limit'

describe('createRateLimiter', () => {
  it('limits a key after max recorded hits within the window', () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 1000, now: () => 0 })
    for (let i = 0; i < 3; i++) {
      expect(limiter.isLimited('1.1.1.1')).toBe(false)
      limiter.record('1.1.1.1')
    }
    expect(limiter.isLimited('1.1.1.1')).toBe(true)
  })

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => 0 })
    limiter.record('a')
    expect(limiter.isLimited('a')).toBe(true)
    expect(limiter.isLimited('b')).toBe(false)
  })

  it('frees the key once the window has passed', () => {
    let now = 0
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => now })
    limiter.record('a')
    now = 999
    expect(limiter.isLimited('a')).toBe(true)
    now = 1001
    expect(limiter.isLimited('a')).toBe(false)
  })

  it('does not count checks, only recorded hits', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => 0 })
    for (let i = 0; i < 10; i++) limiter.isLimited('a')
    expect(limiter.isLimited('a')).toBe(false)
  })
})

describe('firstForwardedIp', () => {
  it('returns the first x-forwarded-for entry, trimmed', () => {
    expect(firstForwardedIp('203.0.113.7, 70.41.3.18, 150.172.238.178')).toBe('203.0.113.7')
    expect(firstForwardedIp('  203.0.113.7  ')).toBe('203.0.113.7')
  })

  it('returns null when absent or empty', () => {
    expect(firstForwardedIp(null)).toBeNull()
    expect(firstForwardedIp('')).toBeNull()
    expect(firstForwardedIp(' , 1.1.1.1')).toBeNull()
  })
})
