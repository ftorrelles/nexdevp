// Client-only sessionStorage access for first-touch attribution.
// No cookies, no network. Every access is guarded: storage can throw (private
// mode, blocked site data) and attribution must never break the page.

import {
  buildAttribution,
  resolveFirstTouch,
  sanitizeAttribution,
  type Attribution,
} from './attribution'

const STORAGE_KEY = 'nex_attribution'

/** Stores first-touch attribution for this session; never overwrites an existing one. */
export function captureAttribution(): void {
  try {
    const candidate = buildAttribution({
      search: window.location.search,
      referrer: document.referrer,
      landingPath: window.location.pathname,
      siteHost: window.location.hostname,
      now: new Date(),
    })
    const { value, shouldWrite } = resolveFirstTouch(
      window.sessionStorage.getItem(STORAGE_KEY),
      candidate
    )
    if (shouldWrite && value) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    }
  } catch {
    // Storage unavailable: skip silently.
  }
}

export function readStoredAttribution(): Attribution | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? sanitizeAttribution(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
