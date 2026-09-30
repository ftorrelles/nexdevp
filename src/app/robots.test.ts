import { describe, it, expect } from 'vitest'
import robots from './robots'

describe('robots()', () => {
  const result = robots()
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
  const group = rules[0]
  const disallow = Array.isArray(group.disallow) ? group.disallow : [group.disallow]

  it('uses a single group for every crawler', () => {
    expect(rules).toHaveLength(1)
    expect(group.userAgent).toBe('*')
  })

  it('allows the root', () => {
    expect(group.allow).toBe('/')
    expect(disallow).not.toContain('/')
  })

  it('disallows the private areas', () => {
    expect(disallow).toEqual(
      expect.arrayContaining([
        '/admin',
        '/api',
        '/auth',
        '/es/proyecto',
        '/en/proyecto',
        '/es/careers/login',
        '/en/careers/login',
        '/es/careers/registro',
        '/en/careers/registro',
        '/es/careers/portal',
        '/en/careers/portal',
      ]),
    )
  })

  it('does not disallow public pages', () => {
    for (const path of ['/es', '/en', '/es/careers', '/en/careers', '/es/casos', '/en/casos']) {
      expect(disallow).not.toContain(path)
    }
  })

  it('points to the sitemap on the canonical www host', () => {
    expect(result.sitemap).toBe('https://www.nexdevp.com/sitemap.xml')
  })
})
