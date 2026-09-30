// ─────────────────────────────────────────────────────────────────────────────
// nexdevp — Lead attribution (first touch, platform-agnostic)
//
// Records where a visitor came from (UTM params, ad click ids, external
// referrer) so a lead can later be tied to a campaign, whatever ad platform is
// used. Everything here is pure: reading the URL/referrer and touching
// sessionStorage lives in `attribution-storage.ts` and runs on the client only.
// ─────────────────────────────────────────────────────────────────────────────

import { cleanText } from './clean-text'

export const ATTRIBUTION_MAX_LENGTH = 300

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const
const CLICK_ID_KEYS = ['fbclid', 'gclid', 'ttclid'] as const
const TRACKING_KEYS = [...UTM_KEYS, ...CLICK_ID_KEYS] as const

export interface Attribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  fbclid?: string
  gclid?: string
  ttclid?: string
  /** External referrer only: origin + pathname, no query string. */
  referrer?: string
  landing_path?: string
  /** ISO timestamp of the first touch. */
  captured_at?: string
}

export const ATTRIBUTION_KEYS: readonly (keyof Attribution)[] = [
  ...TRACKING_KEYS,
  'referrer',
  'landing_path',
  'captured_at',
]

export interface BuildAttributionInput {
  /** `location.search`, with or without the leading "?". */
  search: string
  /** `document.referrer`. */
  referrer: string
  /** `location.pathname` of the landing page. */
  landingPath: string
  /** `location.hostname`, used to discard same-site referrers. */
  siteHost: string
  now: Date
}

function clean(value: string): string {
  return cleanText(value, ATTRIBUTION_MAX_LENGTH)
}

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, '')
}

/** External referrer as origin + pathname (no query string or hash), else null. */
function externalReferrer(referrer: string, siteHost: string): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (stripWww(url.hostname) === stripWww(siteHost)) return null
    return clean(url.origin + url.pathname) || null
  } catch {
    return null
  }
}

/**
 * Builds a first-touch attribution from what the browser exposes on landing.
 * Returns null when there is nothing worth storing (no tracking params and no
 * external referrer) — a plain direct visit is not attribution.
 */
export function buildAttribution(input: BuildAttributionInput): Attribution | null {
  const params = new URLSearchParams(input.search)
  const result: Attribution = {}

  for (const key of TRACKING_KEYS) {
    const value = clean(params.get(key) ?? '')
    if (value) result[key] = value
  }

  const referrer = externalReferrer(input.referrer, input.siteHost)
  if (referrer) result.referrer = referrer

  if (Object.keys(result).length === 0) return null

  const landingPath = clean(input.landingPath)
  if (landingPath) result.landing_path = landingPath
  result.captured_at = input.now.toISOString()
  return result
}

/**
 * Turns an untrusted value (request body, storage) into a valid Attribution:
 * only whitelisted keys, string values, cleaned and capped, empty → null.
 */
export function sanitizeAttribution(input: unknown): Attribution | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null
  const source = input as Record<string, unknown>
  const result: Attribution = {}

  for (const key of ATTRIBUTION_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue
    const value = source[key]
    if (typeof value !== 'string') continue
    const cleaned = clean(value)
    if (!cleaned) continue
    if (key === 'captured_at' && Number.isNaN(Date.parse(cleaned))) continue
    result[key] = cleaned
  }

  return Object.keys(result).length > 0 ? result : null
}

/**
 * First touch wins: a valid stored value is always kept; the candidate is only
 * used (and only needs writing) when nothing valid is stored yet.
 */
export function resolveFirstTouch(
  storedRaw: string | null,
  candidate: Attribution | null
): { value: Attribution | null; shouldWrite: boolean } {
  let stored: Attribution | null = null
  if (storedRaw) {
    try {
      stored = sanitizeAttribution(JSON.parse(storedRaw))
    } catch {
      stored = null
    }
  }
  if (stored) return { value: stored, shouldWrite: false }
  return { value: candidate, shouldWrite: candidate !== null }
}

/**
 * Appends only the stored utm_* values to a URL so the booking tool can see the
 * campaign. Never overrides a param already on the URL; returns the original
 * string if there is nothing to add or the URL cannot be parsed.
 */
export function appendUtmParams(url: string, attribution: Attribution | null): string {
  if (!attribution) return url
  try {
    const parsed = new URL(url)
    let changed = false
    for (const key of UTM_KEYS) {
      const value = attribution[key]
      if (value && !parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, value)
        changed = true
      }
    }
    return changed ? parsed.toString() : url
  } catch {
    return url
  }
}

/**
 * Compact one-line source for the admin: "source / medium / campaign", or the
 * referrer host when there are no UTMs. Null when there is nothing to show.
 */
export function describeAttributionSource(attribution: Attribution | null | undefined): string | null {
  if (!attribution) return null
  const utms = [attribution.utm_source, attribution.utm_medium, attribution.utm_campaign].filter(Boolean)
  if (utms.length > 0) return utms.join(' / ')
  if (attribution.referrer) {
    try {
      return new URL(attribution.referrer).hostname
    } catch {
      return attribution.referrer
    }
  }
  return null
}

/**
 * True when a Supabase/PostgREST error says the `attribution` column is missing
 * (migration not applied yet, or PostgREST's schema cache is stale).
 */
export function isMissingAttributionColumn(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false
  return (
    (error.code === 'PGRST204' || error.code === '42703') &&
    /attribution/i.test(error.message ?? '')
  )
}
