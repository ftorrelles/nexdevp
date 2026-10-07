export const PORTFOLIO_PLAYBACK_DELAY = 5000

export interface PortfolioPlaybackConditions {
  inView: boolean
  reducedMotion: boolean
  hidden: boolean
  focused: boolean
  viewerOpen: boolean
}

export function canPlayPortfolio(conditions: PortfolioPlaybackConditions): boolean {
  return conditions.inView && !conditions.reducedMotion && !conditions.hidden
    && !conditions.focused && !conditions.viewerOpen
}

export function schedulePortfolioAdvance(enabled: boolean, advance: () => void): () => void {
  if (!enabled) return () => {}
  const timer = setTimeout(advance, PORTFOLIO_PLAYBACK_DELAY)
  return () => clearTimeout(timer)
}
