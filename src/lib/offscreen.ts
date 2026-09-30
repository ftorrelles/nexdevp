/**
 * Anchor support for `content-visibility: auto` sections (see OffscreenSection).
 *
 * Skipped sections are laid out with an estimated height, so a scroll to an
 * anchor further down lands off-target once the sections above it render.
 * Setting this attribute on <html> makes every offscreen section render (CSS in
 * globals.css), which makes the layout exact. It is set the first time the
 * visitor navigates to an anchor and is never cleared.
 */
export const RENDER_ALL_ATTR = 'data-render-all'

/** Runs in <head> order before the sections, so a `/#hash` load scrolls on exact layout. */
export const HASH_LOAD_SCRIPT = `if(location.hash)document.documentElement.setAttribute('${RENDER_ALL_ATTR}','')`

/** Returns true when it changed anything (the layout is only exact from now on). */
export function renderAllOffscreenSections(): boolean {
  const root = document.documentElement
  if (root.hasAttribute(RENDER_ALL_ATTR)) return false
  root.setAttribute(RENDER_ALL_ATTR, '')
  return true
}
