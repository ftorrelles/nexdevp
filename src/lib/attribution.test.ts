import { describe, it, expect } from 'vitest'
import {
  appendUtmParams,
  buildAttribution,
  describeAttributionSource,
  isMissingAttributionColumn,
  resolveFirstTouch,
  sanitizeAttribution,
  ATTRIBUTION_MAX_LENGTH,
  type Attribution,
} from './attribution'

const NOW = new Date('2026-05-01T10:00:00.000Z')

function build(overrides: Partial<Parameters<typeof buildAttribution>[0]> = {}): Attribution | null {
  return buildAttribution({
    search: '',
    referrer: '',
    landingPath: '/es',
    siteHost: 'nexdevp.com',
    now: NOW,
    ...overrides,
  })
}

describe('buildAttribution', () => {
  it('returns null for a direct visit with no tracking params', () => {
    expect(build()).toBeNull()
    expect(build({ search: '?foo=bar&page=2' })).toBeNull()
  })

  it('captures every utm and click id, plus landing path and timestamp', () => {
    const result = build({
      search:
        '?utm_source=meta&utm_medium=paid&utm_campaign=spring&utm_term=crm&utm_content=v2&fbclid=F1&gclid=G1&ttclid=T1',
    })
    expect(result).toEqual({
      utm_source: 'meta',
      utm_medium: 'paid',
      utm_campaign: 'spring',
      utm_term: 'crm',
      utm_content: 'v2',
      fbclid: 'F1',
      gclid: 'G1',
      ttclid: 'T1',
      landing_path: '/es',
      captured_at: '2026-05-01T10:00:00.000Z',
    })
  })

  it('accepts a search string without the leading question mark', () => {
    expect(build({ search: 'utm_source=google' })?.utm_source).toBe('google')
  })

  it('ignores empty and whitespace-only params', () => {
    expect(build({ search: '?utm_source=&utm_medium=%20%20' })).toBeNull()
  })

  it('stores an external referrer as origin + pathname without the query string', () => {
    const result = build({ referrer: 'https://www.google.com/search?q=secret+term#frag' })
    expect(result?.referrer).toBe('https://www.google.com/search')
    expect(result?.utm_source).toBeUndefined()
  })

  it('ignores same-site referrers, with or without www', () => {
    expect(build({ referrer: 'https://nexdevp.com/es/casos/x' })).toBeNull()
    expect(build({ referrer: 'https://www.nexdevp.com/en' })).toBeNull()
  })

  it('ignores unparseable and non-http referrers', () => {
    expect(build({ referrer: 'not a url' })).toBeNull()
    expect(build({ referrer: 'android-app://com.google.android.gm' })).toBeNull()
  })

  it('keeps tracking params even when the referrer is same-site', () => {
    const result = build({ search: '?gclid=abc', referrer: 'https://nexdevp.com/' })
    expect(result?.gclid).toBe('abc')
    expect(result?.referrer).toBeUndefined()
  })

  it('caps very long values', () => {
    const result = build({ search: `?utm_campaign=${'x'.repeat(1000)}` })
    expect(result?.utm_campaign).toHaveLength(ATTRIBUTION_MAX_LENGTH)
  })
})

describe('sanitizeAttribution', () => {
  it('keeps whitelisted string keys and trims them', () => {
    expect(sanitizeAttribution({ utm_source: '  meta  ', gclid: 'abc' })).toEqual({
      utm_source: 'meta',
      gclid: 'abc',
    })
  })

  it('drops unknown keys', () => {
    expect(sanitizeAttribution({ utm_source: 'meta', admin: 'true', __proto__: { x: 1 } })).toEqual({
      utm_source: 'meta',
    })
  })

  it('drops non-string values, including nested objects and arrays', () => {
    const result = sanitizeAttribution({
      utm_source: { $ne: '' },
      utm_medium: ['a'],
      utm_campaign: 42,
      utm_term: null,
      utm_content: true,
      fbclid: 'ok',
    })
    expect(result).toEqual({ fbclid: 'ok' })
  })

  it('caps very long strings at 300 characters', () => {
    const result = sanitizeAttribution({ utm_campaign: 'y'.repeat(5000) })
    expect(result?.utm_campaign).toHaveLength(ATTRIBUTION_MAX_LENGTH)
  })

  it('returns null for empty, non-object, array and all-invalid input', () => {
    expect(sanitizeAttribution(null)).toBeNull()
    expect(sanitizeAttribution(undefined)).toBeNull()
    expect(sanitizeAttribution('utm_source=meta')).toBeNull()
    expect(sanitizeAttribution(['utm_source'])).toBeNull()
    expect(sanitizeAttribution({})).toBeNull()
    expect(sanitizeAttribution({ utm_source: '   ', extra: 'x' })).toBeNull()
  })

  it('strips characters Postgres rejects (NUL, lone surrogates) so an insert cannot fail on them', () => {
    const result = sanitizeAttribution({
      utm_source: 'me\u0000ta',
      utm_medium: 'pa\ud83did',
      utm_campaign: 'ok😀',
    })
    expect(result).toEqual({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'ok😀' })
  })

  it('does not leave half an emoji when truncating', () => {
    const result = sanitizeAttribution({ utm_campaign: 'a'.repeat(ATTRIBUTION_MAX_LENGTH - 1) + '😀' })
    expect(result?.utm_campaign).toBe('a'.repeat(ATTRIBUTION_MAX_LENGTH - 1))
  })

  it('drops a captured_at that is not a date', () => {
    expect(sanitizeAttribution({ captured_at: 'yesterday-ish', utm_source: 'x' })).toEqual({
      utm_source: 'x',
    })
    expect(sanitizeAttribution({ captured_at: NOW.toISOString() })).toEqual({
      captured_at: NOW.toISOString(),
    })
  })

  it('round-trips the output of buildAttribution unchanged', () => {
    const built = build({ search: '?utm_source=meta&fbclid=F', referrer: 'https://l.facebook.com/l.php?u=x' })
    expect(sanitizeAttribution(built)).toEqual(built)
  })
})

describe('resolveFirstTouch', () => {
  const candidate: Attribution = { utm_source: 'new' }

  it('uses the candidate and asks to write when nothing is stored', () => {
    expect(resolveFirstTouch(null, candidate)).toEqual({ value: candidate, shouldWrite: true })
  })

  it('never overwrites an existing stored value', () => {
    const stored = JSON.stringify({ utm_source: 'first' })
    expect(resolveFirstTouch(stored, candidate)).toEqual({
      value: { utm_source: 'first' },
      shouldWrite: false,
    })
  })

  it('does not write when there is no candidate', () => {
    expect(resolveFirstTouch(null, null)).toEqual({ value: null, shouldWrite: false })
  })

  it('treats corrupted or hostile stored data as absent', () => {
    expect(resolveFirstTouch('{not json', candidate).shouldWrite).toBe(true)
    expect(resolveFirstTouch('{"admin":"x"}', candidate).shouldWrite).toBe(true)
    expect(resolveFirstTouch('"string"', candidate).shouldWrite).toBe(true)
  })
})

describe('appendUtmParams', () => {
  const url = 'https://cal.com/nexdevp/diagnostico'

  it('returns the original url when nothing is stored or there are no utms', () => {
    expect(appendUtmParams(url, null)).toBe(url)
    expect(appendUtmParams(url, {})).toBe(url)
    expect(appendUtmParams(url, { gclid: 'abc', referrer: 'https://google.com/' })).toBe(url)
  })

  it('appends only utm_* values', () => {
    const result = new URL(
      appendUtmParams(url, { utm_source: 'meta', utm_campaign: 'spring', fbclid: 'F1', referrer: 'https://x.com/' })
    )
    expect(result.searchParams.get('utm_source')).toBe('meta')
    expect(result.searchParams.get('utm_campaign')).toBe('spring')
    expect(result.searchParams.has('fbclid')).toBe(false)
    expect(result.searchParams.has('referrer')).toBe(false)
  })

  it('keeps existing query params and does not override them', () => {
    const result = new URL(
      appendUtmParams(`${url}?name=Ana&utm_source=manual`, { utm_source: 'meta', utm_medium: 'paid' })
    )
    expect(result.searchParams.get('name')).toBe('Ana')
    expect(result.searchParams.get('utm_source')).toBe('manual')
    expect(result.searchParams.get('utm_medium')).toBe('paid')
  })

  it('encodes values safely', () => {
    const result = appendUtmParams(url, { utm_campaign: 'a b&c=d' })
    expect(new URL(result).searchParams.get('utm_campaign')).toBe('a b&c=d')
  })

  it('returns the input untouched when the url cannot be parsed', () => {
    expect(appendUtmParams('not a url', { utm_source: 'meta' })).toBe('not a url')
  })
})

describe('describeAttributionSource', () => {
  it('joins source / medium / campaign', () => {
    expect(
      describeAttributionSource({ utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'spring' })
    ).toBe('meta / paid / spring')
    expect(describeAttributionSource({ utm_source: 'google' })).toBe('google')
  })

  it('falls back to the referrer host when there are no utms', () => {
    expect(describeAttributionSource({ referrer: 'https://l.facebook.com/l.php', gclid: 'x' })).toBe(
      'l.facebook.com'
    )
  })

  it('returns null when there is nothing to show', () => {
    expect(describeAttributionSource(null)).toBeNull()
    expect(describeAttributionSource({ gclid: 'x' })).toBeNull()
  })
})

describe('isMissingAttributionColumn', () => {
  it('detects the PostgREST schema-cache error for the attribution column', () => {
    expect(
      isMissingAttributionColumn({
        code: 'PGRST204',
        message: "Could not find the 'attribution' column of 'leads' in the schema cache",
      })
    ).toBe(true)
    expect(
      isMissingAttributionColumn({ code: '42703', message: 'column "attribution" of relation "leads" does not exist' })
    ).toBe(true)
  })

  it('does not match other errors', () => {
    expect(isMissingAttributionColumn(null)).toBe(false)
    expect(isMissingAttributionColumn({ code: 'PGRST204', message: "Could not find the 'foo' column" })).toBe(false)
    expect(isMissingAttributionColumn({ code: '23505', message: 'duplicate key attribution' })).toBe(false)
    expect(isMissingAttributionColumn({ message: 'attribution' })).toBe(false)
  })
})
