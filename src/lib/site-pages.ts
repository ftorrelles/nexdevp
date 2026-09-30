import { routing } from '@/i18n/routing'
import { getPublishedCases } from '@/content/case-studies'
import { SITE_URL } from '@/lib/constants'
import type { CaseStudy, Locale } from '@/content/types'

export interface SitePage {
  kind: 'home' | 'careers' | 'case'
  locale: Locale
  path: string
  url: string
  /** Path of this same page in every locale (feeds hreflang alternates). */
  paths: Record<Locale, string>
  /** Set on case pages only. */
  caseStudy?: CaseStudy
}

// Single list of indexable pages, shared by the sitemap and /llms.txt so an
// unpublished case can never reach either of them.
export function getSitePages(): SitePage[] {
  const locales = [...routing.locales] as Locale[]
  const pages: SitePage[] = []

  const homePaths: Record<Locale, string> = { es: '/es', en: '/en' }
  const careersPaths: Record<Locale, string> = { es: '/es/careers', en: '/en/careers' }

  for (const locale of locales) {
    pages.push({
      kind: 'home',
      locale,
      path: homePaths[locale],
      url: `${SITE_URL}${homePaths[locale]}`,
      paths: homePaths,
    })
  }

  for (const locale of locales) {
    pages.push({
      kind: 'careers',
      locale,
      path: careersPaths[locale],
      url: `${SITE_URL}${careersPaths[locale]}`,
      paths: careersPaths,
    })
  }

  for (const caseStudy of getPublishedCases()) {
    const casePaths: Record<Locale, string> = {
      es: `/es/casos/${caseStudy.slugMap.es}`,
      en: `/en/casos/${caseStudy.slugMap.en}`,
    }
    for (const locale of locales) {
      pages.push({
        kind: 'case',
        locale,
        path: casePaths[locale],
        url: `${SITE_URL}${casePaths[locale]}`,
        paths: casePaths,
        caseStudy,
      })
    }
  }

  return pages
}
