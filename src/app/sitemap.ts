import type { MetadataRoute } from 'next'
import { getSitePages, type SitePage } from '@/lib/site-pages'
import { SITE_URL } from '@/lib/constants'

type SitemapEntry = MetadataRoute.Sitemap[number]

const CHANGE_FREQUENCY: Record<SitePage['kind'], SitemapEntry['changeFrequency']> = {
  home: 'monthly',
  careers: 'weekly',
  case: 'monthly',
}

const PRIORITY: Record<SitePage['kind'], number> = {
  home: 1,
  careers: 0.5,
  case: 0.8,
}

function toEntry(page: SitePage): SitemapEntry {
  const entry: SitemapEntry = {
    url: page.url,
    changeFrequency: CHANGE_FREQUENCY[page.kind],
    priority: PRIORITY[page.kind],
    alternates: {
      languages: {
        es: `${SITE_URL}${page.paths.es}`,
        en: `${SITE_URL}${page.paths.en}`,
        'x-default': `${SITE_URL}${page.paths.es}`,
      },
    },
  }
  // Only a real content date is worth advertising: a build-time stamp would
  // change on every deploy and teach crawlers to ignore lastmod.
  const updatedAt = page.caseStudy?.updatedAt
  if (updatedAt) entry.lastModified = updatedAt
  return entry
}

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitePages().map(toEntry)
}
