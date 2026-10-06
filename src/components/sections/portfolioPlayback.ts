export const PORTFOLIO_PLAYBACK_DELAY = 6000

export interface PortfolioPlaybackConditions {
  ready: boolean
  userPaused: boolean
  reducedMotion: boolean
  hidden: boolean
  hovered: boolean
  focused: boolean
  viewerOpen: boolean
}

export function canPlayPortfolio(conditions: PortfolioPlaybackConditions): boolean {
  return conditions.ready && !conditions.userPaused && !conditions.reducedMotion && !conditions.hidden
    && !conditions.hovered && !conditions.focused && !conditions.viewerOpen
}

export function schedulePortfolioAdvance(enabled: boolean, advance: () => void): () => void {
  if (!enabled) return () => {}
  const timer = setTimeout(advance, PORTFOLIO_PLAYBACK_DELAY)
  return () => clearTimeout(timer)
}
