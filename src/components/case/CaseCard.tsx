import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/editorial/Card'
import { Link } from '@/i18n/navigation'
import { pick } from '@/content/types'
import type { CaseStudy, Locale } from '@/content/types'

interface CaseCardProps {
  caseStudy: CaseStudy
  locale: Locale
}

export async function CaseCard({ caseStudy, locale }: CaseCardProps) {
  const t = await getTranslations('cases')

  const slug = caseStudy.slugMap[locale]
  const basePath = locale === 'es' ? 'casos' : 'cases'
  const href = `/${basePath}/${slug}`

  // Get the first paragraph of pain as the pain headline
  const painBlocks = pick(caseStudy.pain, locale)
  const firstPain = painBlocks.find((b) => b.type === 'paragraph')
  const painHeadline = firstPain && firstPain.type === 'paragraph' ? firstPain.text : ''

  const firstMetric = caseStudy.metrics[0]

  return (
    <Card className="flex flex-col h-full">
      <p className="font-dm-mono text-xs text-accent uppercase tracking-widest mb-2">
        {pick(caseStudy.industry, locale)}
      </p>
      <h3 className="font-cormorant text-2xl text-cream mb-3">{caseStudy.client}</h3>
      <p className="font-jost text-sm text-muted leading-relaxed mb-4 line-clamp-3 flex-1">
        {painHeadline}
      </p>
      {firstMetric && (
        <div className="border-t border-cream/10 pt-4 mb-4">
          <span className="font-dm-mono text-2xl text-accent">{firstMetric.value}</span>
          <span className="font-jost text-xs text-muted ml-2">
            {pick(firstMetric.label, locale)}
          </span>
        </div>
      )}
      <Link
        href={href}
        className="font-dm-mono text-xs text-accent uppercase tracking-widest hover:underline"
      >
        {t('viewCase')} →
      </Link>
    </Card>
  )
}
