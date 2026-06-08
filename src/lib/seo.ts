import type { Metadata } from 'next'
import type { CaseStudy, Service, Locale } from '@/content/types'
import { SITE_URL } from '@/lib/constants'

type PageKey = 'home' | 'case'

interface SeoOverrides {
  title?: string
  description?: string
  /** For case pages: the slug in each locale so hreflang alternates are correct */
  slugMap?: Record<Locale, string>
  /** Current page slug (in the request locale) */
  slug?: string
}

const defaultTitles: Record<Locale, string> = {
  es: 'nexdevp — Sistemas digitales para empresas',
  en: 'nexdevp — Digital systems for business',
}

const defaultDescriptions: Record<Locale, string> = {
  es: 'Diseñamos e implementamos sistemas digitales que hacen crecer tu negocio. Consultoría, desarrollo y automatización.',
  en: 'We design and implement digital systems that grow your business. Consulting, development and automation.',
}

function buildCaseUrl(locale: Locale, slug: string): string {
  return `${SITE_URL}/${locale}/casos/${slug}`
}

function buildHomeUrl(locale: Locale): string {
  return `${SITE_URL}/${locale}`
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
  } else {
    canonical = buildHomeUrl(locale)
    alternateLanguages = {
      es: buildHomeUrl('es'),
      en: buildHomeUrl('en'),
      'x-default': buildHomeUrl('es'),
    }
  }

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
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      type: 'website',
      siteName: 'nexdevp',
      images: [
        {
          url: `${SITE_URL}/og/og-default.png`,
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
      images: [`${SITE_URL}/og/og-default.png`],
    },
  }
}

// ─── JSON-LD Builders ────────────────────────────────────────────────────────

export function buildOrganizationSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'nexdevp',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/brand/logo-light.png`,
    sameAs: [],
    description:
      locale === 'es'
        ? 'Sistemas digitales que hacen crecer tu negocio.'
        : 'Digital systems that grow your business.',
  }
}

export function buildServiceSchema(services: Service[], locale: Locale) {
  return services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    provider: { '@type': 'Organization', name: 'nexdevp' },
    name: service.painHeadline[locale],
    description: service.whatWeBuilt[locale],
  }))
}

export function buildCaseStudySchema(caseStudy: CaseStudy, locale: Locale) {
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
      inLanguage: locale === 'es' ? 'es-ES' : 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url,
      author: { '@type': 'Organization', name: 'nexdevp' },
      publisher: { '@type': 'Organization', name: 'nexdevp' },
      about: caseStudy.client,
    },
  ]
}
