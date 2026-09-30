import type { Metadata } from 'next'
import type { CaseStudy, Service, Locale } from '@/content/types'
import { SITE_URL, SOCIAL_PROFILES, WHATSAPP_NUMBER } from '@/lib/constants'

const BRAND = 'nexdevp'
export const TITLE_MAX_LENGTH = 60
export const DESCRIPTION_MIN_LENGTH = 140
export const DESCRIPTION_MAX_LENGTH = 160

// Stable ids so the JSON-LD entities can reference each other.
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

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
  es: 'Consultora de software a medida: sistemas internos, automatizaciones con IA y sitios web para problemas concretos de tu empresa. Primera consulta sin costo.',
  en: 'Custom software consultancy: internal systems, AI automations and websites that solve specific problems in your company. First consultation is free.',
}

const OG_LOCALES: Record<Locale, { locale: string; alternate: string }> = {
  es: { locale: 'es_ES', alternate: 'en_US' },
  en: { locale: 'en_US', alternate: 'es_ES' },
}

// Appends " | nexdevp" only when the result stays within the title budget and
// the brand is not already part of the title.
export function withBrand(title: string): string {
  if (title.toLowerCase().includes(BRAND)) return title
  const branded = `${title} | ${BRAND}`
  return branded.length <= TITLE_MAX_LENGTH ? branded : title
}

export function getDefaultSeo(locale: Locale): { title: string; description: string } {
  return { title: withBrand(defaultTitles[locale]), description: defaultDescriptions[locale] }
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
  const title = withBrand(overrides?.title ?? defaultTitles[locale])
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

const ORGANIZATION_REF = { '@id': ORGANIZATION_ID }
const WEBSITE_REF = { '@id': WEBSITE_ID }

export function buildOrganizationSchema(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: BRAND,
    url: buildHomeUrl(locale),
    logo: `${SITE_URL}/brand/icon-512.png`,
    description:
      locale === 'es'
        ? 'Consultora de software a medida y automatización con IA.'
        : 'Custom software and AI automation consultancy.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: `+${WHATSAPP_NUMBER.replace(/\D/g, '')}`,
      availableLanguage: ['es', 'en'],
    },
    ...(SOCIAL_PROFILES.length > 0 ? { sameAs: SOCIAL_PROFILES } : {}),
  }
}

export function buildWebSiteSchema(locale: Locale): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: BRAND,
    url: buildHomeUrl(locale),
    inLanguage: locale,
    publisher: ORGANIZATION_REF,
  }
}

export function buildServiceSchema(services: Service[], locale: Locale): Record<string, unknown>[] {
  return services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: ORGANIZATION_REF,
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
      isPartOf: WEBSITE_REF,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url,
      image: buildOgImageUrl(locale),
      inLanguage: locale,
      author: ORGANIZATION_REF,
      publisher: ORGANIZATION_REF,
      isPartOf: WEBSITE_REF,
      about: caseStudy.client,
      ...(caseStudy.updatedAt ? { dateModified: caseStudy.updatedAt } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BRAND, item: buildHomeUrl(locale) },
        { '@type': 'ListItem', position: 2, name: caseStudy.client, item: url },
      ],
    },
  ]
}
