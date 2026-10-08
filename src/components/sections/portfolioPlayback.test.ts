import { afterEach, describe, expect, it, vi } from 'vitest'
import { canPlayPortfolio, PORTFOLIO_PLAYBACK_DELAY, schedulePortfolioAdvance, type PortfolioPlaybackConditions } from './portfolioPlayback'

const readyConditions: PortfolioPlaybackConditions = {
  inView: true, reducedMotion: false, hidden: false,
  focused: false,
}

afterEach(() => vi.useRealTimers())

describe('portfolio playback conditions', () => {
  it('runs only while the section is in view and no pause reason is active', () => {
    expect(canPlayPortfolio(readyConditions)).toBe(true)
    expect(canPlayPortfolio({ ...readyConditions, inView: false })).toBe(false)
  })

  it.each(['reducedMotion', 'hidden', 'focused'] as const)('does not run while %s is active', (condition) => {
    expect(canPlayPortfolio({ ...readyConditions, [condition]: true })).toBe(false)
  })
})

describe('five-second scheduling', () => {
  it('waits a full five seconds and advances exactly once per scheduled cycle', () => {
    vi.useFakeTimers()
    const advance = vi.fn()
    const cleanup = schedulePortfolioAdvance(true, advance)
    expect(PORTFOLIO_PLAYBACK_DELAY).toBe(5000)
    vi.advanceTimersByTime(4999)
    expect(advance).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(advance).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5000)
    expect(advance).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('cancels old timers on interaction or cleanup, restarting with a full interval', () => {
    vi.useFakeTimers()
    const advance = vi.fn()
    const cancel = schedulePortfolioAdvance(true, advance)
    vi.advanceTimersByTime(4000)
    cancel()
    const cleanup = schedulePortfolioAdvance(true, advance)
    vi.advanceTimersByTime(4999)
    expect(advance).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(advance).toHaveBeenCalledTimes(1)
    cleanup()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('creates no timer while playback is paused', () => {
    vi.useFakeTimers()
    const advance = vi.fn()
    const cleanup = schedulePortfolioAdvance(false, advance)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(12000)
    expect(advance).not.toHaveBeenCalled()
    cleanup()
  })
})
