import { describe, it, expect } from 'vitest'
import { serializeJsonLd } from './json-ld'

describe('serializeJsonLd', () => {
  it('round-trips plain data', () => {
    const data = { '@type': 'Organization', name: 'nexdevp', list: [1, 'two', null, true] }
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
  })

  it('cannot close the script element', () => {
    const data = { name: '</script><script>alert(1)</script>' }
    const out = serializeJsonLd(data)
    expect(out).not.toContain('</script')
    expect(out).not.toContain('<')
    expect(out).toContain('\\u003c/script\\u003e')
    expect(JSON.parse(out)).toEqual(data)
  })

  it('escapes <, >, & and the line separators as \\uXXXX', () => {
    const out = serializeJsonLd({ v: '<>&\u2028\u2029' })
    expect(out).toBe('{"v":"\\u003c\\u003e\\u0026\\u2028\\u2029"}')
    expect(JSON.parse(out)).toEqual({ v: '<>&\u2028\u2029' })
  })

  it('escapes keys as well as values', () => {
    const out = serializeJsonLd({ '<k>': 1 })
    expect(out).not.toContain('<')
    expect(JSON.parse(out)).toEqual({ '<k>': 1 })
  })

  it('serializes undefined as null instead of throwing', () => {
    expect(serializeJsonLd(undefined)).toBe('null')
  })
})
