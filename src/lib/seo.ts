import type { Metadata } from 'next'
import type { CaseStudy, Service, Locale } from '@/content/types'
import { SITE_URL } from '@/lib/constants'

type PageKey = 'home' | 'case' | 'careers'

interface SeoOverrides {
  title?: string
  description?: string
  /** For case pages: the slug in each locale so hreflang alternates are correct */
  slugMap?: Record<Locale, string>
  /** Current page slug (in the request locale) */
  slug?: string
}

// Single source for the landing title/description (used by the locale layout
// as the site-wide default and by the home page metadata).
const defaultTitles: Record<Locale, string> = {
  es: 'Software a medida y automatización con IA | nexdevp',
  en: 'Custom software & AI automation for business | nexdevp',
}

const defaultDescriptions: Record<Locale, string> = {
  es: 'Consultora de software a medida: sistemas internos, automatizaciones con IA y sitios web que resuelven problemas concretos de tu empresa. Primera consulta sin costo.',
  en: 'Custom software consultancy: internal systems, AI automations and websites that solve specific problems in your company. First consultation is free.',
}

const OG_LOCALES: Record<Locale, { locale: string; alternate: string }> = {
  es: { locale: 'es_ES', alternate: 'en_US' },
  en: { locale: 'en_US', alternate: 'es_ES' },
}

export function getDefaultSeo(locale: Locale): { title: string; description: string } {
  return { title: defaultTitles[locale], description: defaultDescriptions[locale] }
}

export function buildOgImageUrl(locale: Locale): string {
  return `${SITE_URL}/og/og-${locale}.png`
}

function buildCaseUrl(locale: Locale, slug: string): string {
  return `${SITE_URL}/${locale}/casos/${slug}`
}

function buildHomeUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}`
}

function buildCareersUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}/careers`
}

export function buildMetadata(
  locale: Locale,
  pageKey: PageKey,
  overrides?: SeoOverrides,
): Metadata {
  const title = overrides?.title ?? defaultTitles[locale]
  const description = overrides?.description ?? defaultDescriptions[locale]

  let canonical: string
  let alternateLanguages: Record<string, string>

  if (pageKey === 'case' && overrides?.slugMap) {
    canonical = buildCaseUrl(locale, overrides.slugMap[locale])
    alternateLanguages = {
      es: buildCaseUrl('es', overrides.slugMap.es),
      en: buildCaseUrl('en', overrides.slugMap.en),
      'x-default': buildCaseUrl('es', overrides.slugMap.es),
    }
  } else if (pageKey === 'careers') {
    canonical = buildCareersUrl(locale)
    alternateLanguages = {
      es: buildCareersUrl('es'),
      en: buildCareersUrl('en'),
      'x-default': buildCareersUrl('es'),
    }
  } else {
    canonical = buildHomeUrl(locale)
    alternateLanguages = {
      es: buildHomeUrl('es'),
      en: buildHomeUrl('en'),
      'x-default': buildHomeUrl('es'),
    }
  }

  const ogImage = buildOgImageUrl(locale)

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: OG_LOCALES[locale].locale,
      alternateLocale: [OG_LOCALES[locale].alternate],
      type: 'website',
      siteName: 'nexdevp',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

// ─── JSON-LD Builders ────────────────────────────────────────────────────────

export function buildOrganizationSchema(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'nexdevp',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/brand/icon-512.png`,
    description:
      locale === 'es'
        ? 'Consultora de software a medida y automatización con IA.'
        : 'Custom software and AI automation consultancy.',
  }
}

export function buildWebSiteSchema(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'nexdevp',
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale,
    publisher: { '@type': 'Organization', name: 'nexdevp' },
  }
}

export function buildServiceSchema(services: Service[], locale: Locale): Record<string, unknown>[] {
  return services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: { '@type': 'Organization', name: 'nexdevp' },
    name: service.painHeadline[locale],
    description: service.whatWeBuilt[locale],
  }))
}

export function buildCaseStudySchema(caseStudy: CaseStudy, locale: Locale): Record<string, unknown>[] {
  const slug = caseStudy.slugMap[locale]
  const url = buildCaseUrl(locale, slug)
  const title = caseStudy.seo.title[locale]
  const description = caseStudy.seo.description[locale]

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url,
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url,
      image: buildOgImageUrl(locale),
      inLanguage: locale,
      author: { '@type': 'Organization', name: 'nexdevp' },
      publisher: { '@type': 'Organization', name: 'nexdevp' },
      about: caseStudy.client,
    },
  ]
}
