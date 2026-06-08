import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { getCaseBySlug, getPublishedSlugsForLocale } from '@/content/case-studies'
import { CaseDetail } from '@/components/case/CaseDetail'
import { buildMetadata, buildCaseStudySchema } from '@/lib/seo'
import type { Locale } from '@/content/types'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export function generateStaticParams() {
  const pairs: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    const slugs = getPublishedSlugsForLocale(locale as Locale)
    for (const slug of slugs) {
      pairs.push({ locale, slug })
    }
  }
  return pairs
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const caseStudy = getCaseBySlug(slug, locale as Locale)
  if (!caseStudy) return {}

  return buildMetadata(locale as Locale, 'case', {
    title: caseStudy.seo.title[locale as Locale],
    description: caseStudy.seo.description[locale as Locale],
    slugMap: caseStudy.slugMap,
    slug,
  })
}

export default async function CaseDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale as Locale)

  const caseStudy = getCaseBySlug(slug, locale as Locale)
  if (!caseStudy) notFound()

  const jsonLd = buildCaseStudySchema(caseStudy, locale as Locale)

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <main>
        <CaseDetail caseStudy={caseStudy} locale={locale as Locale} />
      </main>
    </>
  )
}
