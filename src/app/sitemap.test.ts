import { describe, it, expect } from 'vitest'
import sitemap from './sitemap'
import { getPublishedCases } from '@/content/case-studies'

describe('sitemap()', () => {
  const entries = sitemap()

  it('lists home and careers per locale plus one entry per published case and locale', () => {
    expect(entries).toHaveLength(4 + getPublishedCases().length * 2)
  })

  it('keeps every URL on the canonical www host', () => {
    for (const entry of entries) {
      expect(entry.url.startsWith('https://www.nexdevp.com/')).toBe(true)
    }
  })

  it('omits lastModified for home and careers', () => {
    const undated = entries.filter((e) => !e.url.includes('/casos/'))
    expect(undated).toHaveLength(4)
    for (const entry of undated) {
      expect(entry).not.toHaveProperty('lastModified')
    }
  })

  it('uses the content updatedAt as lastModified for cases', () => {
    for (const caseStudy of getPublishedCases()) {
      for (const locale of ['es', 'en'] as const) {
        const url = `https://www.nexdevp.com/${locale}/casos/${caseStudy.slugMap[locale]}`
        const entry = entries.find((e) => e.url === url)
        expect(entry?.lastModified).toBe(caseStudy.updatedAt)
      }
    }
  })

  it('is deterministic between calls (no build-time stamp)', () => {
    expect(sitemap()).toEqual(entries)
  })

  it('declares reciprocal language alternates, with es as x-default', () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string>
      expect(Object.keys(languages).sort()).toEqual(['en', 'es', 'x-default'])
      expect(languages['x-default']).toBe(languages.es)
      expect([languages.es, languages.en]).toContain(entry.url)
    }
  })
})
