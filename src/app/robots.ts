import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { SITE_URL } from '@/lib/constants'

// Private/auth-gated areas. The locale-prefixed ones are also `noindex` via
// page metadata; disallowing them here saves crawl budget.
const PRIVATE_LOCALE_PATHS = ['proyecto', 'careers/login', 'careers/registro', 'careers/portal']

// A single group on purpose: AI search and training crawlers are allowed, so
// per-bot groups would add nothing.
export default function robots(): MetadataRoute.Robots {
  const localePrivate = routing.locales.flatMap((locale) =>
    PRIVATE_LOCALE_PATHS.map((path) => `/${locale}/${path}`),
  )

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth', ...localePrivate],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
