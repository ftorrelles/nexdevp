import { afterEach, describe, expect, it, vi } from 'vitest'
import { canPlayPortfolio, PORTFOLIO_PLAYBACK_DELAY, schedulePortfolioAdvance, type PortfolioPlaybackConditions } from './portfolioPlayback'
import { createRealProjectSelection, realProjectSelectionReducer } from './realProjectSelection'
import { REAL_PROJECT_CATEGORIES } from '@/content/realProjects'

const readyConditions: PortfolioPlaybackConditions = {
  ready: true, userPaused: false, reducedMotion: false, hidden: false,
  hovered: false, focused: false, viewerOpen: false,
}

afterEach(() => vi.useRealTimers())

describe('portfolio playback conditions', () => {
  it('starts only after client readiness and when every pause reason is absent', () => {
    expect(canPlayPortfolio(readyConditions)).toBe(true)
    expect(canPlayPortfolio({ ...readyConditions, ready: false })).toBe(false)
  })

  it.each(['userPaused', 'reducedMotion', 'hidden', 'hovered', 'focused', 'viewerOpen'] as const)('does not run while %s is active', (condition) => {
    expect(canPlayPortfolio({ ...readyConditions, [condition]: true })).toBe(false)
  })

  it('keeps an explicit user pause when transient interaction or visibility resumes', () => {
    const paused = { ...readyConditions, userPaused: true, hidden: true, hovered: true }
    expect(canPlayPortfolio({ ...paused, hidden: false, hovered: false })).toBe(false)
    expect(canPlayPortfolio({ ...paused, hidden: false, hovered: false, userPaused: false })).toBe(true)
  })
})

describe('six-second scheduling and selected-category wrapping', () => {
  it.each(REAL_PROJECT_CATEGORIES)('advances and wraps only %s, preserving category memory', (category) => {
    let state = createRealProjectSelection(category)
    state = realProjectSelectionReducer(state, { type: 'project', index: 2 })
    state = realProjectSelectionReducer(state, { type: 'advance' })
    expect(state.category).toBe(category)
    expect(state.indices[category]).toBe(0)
    state = realProjectSelectionReducer(state, { type: 'advance' })
    expect(state.indices[category]).toBe(1)
    for (const other of REAL_PROJECT_CATEGORIES.filter((item) => item !== category)) expect(state.indices[other]).toBe(0)
  })

  it('waits a full six seconds and advances exactly once per scheduled cycle', () => {
    vi.useFakeTimers()
    const advance = vi.fn()
    const cleanup = schedulePortfolioAdvance(true, advance)
    expect(PORTFOLIO_PLAYBACK_DELAY).toBe(6000)
    vi.advanceTimersByTime(5999)
    expect(advance).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(advance).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(6000)
    expect(advance).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('cancels old timers on interaction or cleanup, restarting with a full interval', () => {
    vi.useFakeTimers()
    const advance = vi.fn()
    const cancel = schedulePortfolioAdvance(true, advance)
    vi.advanceTimersByTime(5000)
    cancel()
    const cleanup = schedulePortfolioAdvance(true, advance)
    vi.advanceTimersByTime(5999)
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
