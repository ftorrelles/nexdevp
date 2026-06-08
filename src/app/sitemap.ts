import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { getPublishedCases } from '@/content/case-studies'
import { SITE_URL } from '@/lib/constants'
import type { Locale } from '@/content/types'

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = [...routing.locales] as Locale[]
  const cases = getPublishedCases()
  const entries: MetadataRoute.Sitemap = []

  // Homepage per locale
  for (const locale of locales) {
    entries.push({
      url: `${SITE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    })
  }

  // Case detail pages per locale
  for (const caseStudy of cases) {
    for (const locale of locales) {
      const slug = caseStudy.slugMap[locale]
      entries.push({
        url: `${SITE_URL}/${locale}/casos/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  }

  return entries
}
