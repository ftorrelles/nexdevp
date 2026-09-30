import { describe, it, expect } from 'vitest'
import {
  buildCaseStudySchema,
  buildMetadata,
  buildOrganizationSchema,
  buildWebSiteSchema,
  getDefaultSeo,
  withBrand,
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  TITLE_MAX_LENGTH,
} from './seo'
import { SOCIAL_PROFILES } from './constants'
import { getPublishedCases } from '@/content/case-studies'
import { SITE_URL } from './constants'
import type { Locale } from '@/content/types'
import es from '../../messages/es.json'
import en from '../../messages/en.json'

const LOCALES: Locale[] = ['es', 'en']
const MESSAGES = { es, en }

interface SeoSource {
  label: string
  title: string
  description: string
}

function collectSeoSources(): SeoSource[] {
  const sources: SeoSource[] = []
  for (const locale of LOCALES) {
    const home = buildMetadata(locale, 'home')
    sources.push({
      label: `home/${locale}`,
      title: String(home.title),
      description: String(home.description),
    })
    const layoutDefault = getDefaultSeo(locale)
    sources.push({ label: `layout default/${locale}`, ...layoutDefault })

    const careers = buildMetadata(locale, 'careers', {
      title: MESSAGES[locale].careers.metaTitle,
      description: MESSAGES[locale].careers.metaDescription,
    })
    sources.push({
      label: `careers/${locale}`,
      title: String(careers.title),
      description: String(careers.description),
    })

    for (const caseStudy of getPublishedCases()) {
      const meta = buildMetadata(locale, 'case', {
        title: caseStudy.seo.title[locale],
        description: caseStudy.seo.description[locale],
        slugMap: caseStudy.slugMap,
        slug: caseStudy.slugMap[locale],
      })
      sources.push({
        label: `case ${caseStudy.id}/${locale}`,
        title: String(meta.title),
        description: String(meta.description),
      })
    }
  }
  return sources
}

describe('withBrand', () => {
  it('appends the brand with " | " when it fits', () => {
    expect(withBrand('Short title')).toBe('Short title | nexdevp')
  })

  it('leaves the title alone when the result would exceed the limit', () => {
    const title = 'x'.repeat(TITLE_MAX_LENGTH - ' | nexdevp'.length + 1)
    expect(withBrand(title)).toBe(title)
  })

  it('appends the brand when the result is exactly at the limit', () => {
    const title = 'x'.repeat(TITLE_MAX_LENGTH - ' | nexdevp'.length)
    expect(withBrand(title)).toHaveLength(TITLE_MAX_LENGTH)
  })

  it('does not duplicate a brand already in the title', () => {
    expect(withBrand('Custom software | nexdevp')).toBe('Custom software | nexdevp')
    expect(withBrand('NexDevP: something')).toBe('NexDevP: something')
  })
})

describe('title and description lengths', () => {
  const sources = collectSeoSources()

  it('covers home, layout default, careers and every published case in both locales', () => {
    const cases = getPublishedCases().length
    expect(sources).toHaveLength(LOCALES.length * (3 + cases))
  })

  it.each(sources)(`$label: title is at most ${TITLE_MAX_LENGTH} characters`, ({ title }) => {
    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX_LENGTH)
  })

  it.each(sources)(
    `$label: description is ${DESCRIPTION_MIN_LENGTH}-${DESCRIPTION_MAX_LENGTH} characters`,
    ({ description }) => {
      expect(description.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN_LENGTH)
      expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX_LENGTH)
    },
  )

  it.each(sources)('$label: title uses " | " as the only brand separator', ({ title }) => {
    expect(title).not.toMatch(/\s[—–-]\s*nexdevp$/i)
  })
})

describe('published case content', () => {
  it.each(getPublishedCases().map((c) => [c.id, c.updatedAt] as const))(
    '%s has a real ISO updatedAt date',
    (_id, updatedAt) => {
      expect(updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(updatedAt ?? ''))).toBe(false)
    },
  )
})

describe('JSON-LD entities', () => {
  const ORG_ID = `${SITE_URL}/#organization`
  const SITE_ID = `${SITE_URL}/#website`

  it.each(LOCALES)('organization has a stable id and a sales contact point (%s)', (locale) => {
    const org = buildOrganizationSchema(locale)
    expect(org['@id']).toBe(ORG_ID)
    expect(org.url).toBe(`${SITE_URL}/${locale}`)
    expect(org.contactPoint).toEqual({
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: '+34677525806',
      availableLanguage: ['es', 'en'],
    })
  })

  it('lists the company profiles as sameAs, each an absolute https URL', () => {
    const org = buildOrganizationSchema('es')
    expect(org.sameAs).toEqual(SOCIAL_PROFILES)
    expect(SOCIAL_PROFILES.length).toBeGreaterThan(0)
    for (const url of SOCIAL_PROFILES) expect(url).toMatch(/^https:\/\/[^\s?]+$/)
  })

  it.each(LOCALES)('website references the organization by id as publisher (%s)', (locale) => {
    const site = buildWebSiteSchema(locale)
    expect(site['@id']).toBe(SITE_ID)
    expect(site.publisher).toEqual({ '@id': ORG_ID })
  })

  describe.each(LOCALES)('case schema (%s)', (locale) => {
    const caseStudy = getPublishedCases()[0]
    const [webPage, article, breadcrumb] = buildCaseStudySchema(caseStudy, locale)
    const url = `${SITE_URL}/${locale}/casos/${caseStudy.slugMap[locale]}`

    it('links WebPage and Article to the website and organization by id', () => {
      expect(webPage.isPartOf).toEqual({ '@id': SITE_ID })
      expect(article.isPartOf).toEqual({ '@id': SITE_ID })
      expect(article.author).toEqual({ '@id': ORG_ID })
      expect(article.publisher).toEqual({ '@id': ORG_ID })
    })

    it('uses the real updatedAt as dateModified and no invented publish date', () => {
      expect(article.dateModified).toBe(caseStudy.updatedAt)
      expect(article).not.toHaveProperty('datePublished')
    })

    it('has a two-step breadcrumb with absolute URLs', () => {
      expect(breadcrumb['@type']).toBe('BreadcrumbList')
      expect(breadcrumb.itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: 'nexdevp', item: `${SITE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: caseStudy.client, item: url },
      ])
    })
  })
})
