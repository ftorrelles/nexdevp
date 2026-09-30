import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getPublishedCases } from '@/content/case-studies'
import { SITE_URL } from '@/lib/constants'
import type { Locale } from '@/content/types'

// Evaluated once when the module loads (build time for this static route),
// not on every request.
const LAST_MODIFIED = new Date()

function languageAlternates(paths: Record<Locale, string>): Record<string, string> {
  return {
    es: `${SITE_URL}${paths.es}`,
    en: `${SITE_URL}${paths.en}`,
    'x-default': `${SITE_URL}${paths.es}`,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = [...routing.locales] as Locale[]
  const cases = getPublishedCases()
  const entries: MetadataRoute.Sitemap = []

  const homePaths: Record<Locale, string> = { es: '/es', en: '/en' }
  const careersPaths: Record<Locale, string> = { es: '/es/careers', en: '/en/careers' }

  for (const locale of locales) {
    entries.push({
      url: `${SITE_URL}${homePaths[locale]}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages: languageAlternates(homePaths) },
    })
  }

  for (const locale of locales) {
    entries.push({
      url: `${SITE_URL}${careersPaths[locale]}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: languageAlternates(careersPaths) },
    })
  }

  for (const caseStudy of cases) {
    const casePaths: Record<Locale, string> = {
      es: `/es/casos/${caseStudy.slugMap.es}`,
      en: `/en/casos/${caseStudy.slugMap.en}`,
    }
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}${casePaths[locale]}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: languageAlternates(casePaths) },
      })
    }
  }

  return entries
}
