import { getTranslations } from 'next-intl/server'
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

  const painBlocks = pick(caseStudy.pain, locale)
  const firstPain = painBlocks.find((b) => b.type === 'paragraph')
  const painHeadline = firstPain && firstPain.type === 'paragraph' ? firstPain.text : ''

  const firstMetric = caseStudy.metrics[0]

  return (
    <div className="bg-nex-black rounded-xl border border-white/5 p-6 flex flex-col h-full">
      {/* Industry badge */}
      <p className="font-dm-mono text-xs text-nex-green uppercase tracking-widest mb-2">
        {pick(caseStudy.industry, locale)}
      </p>

      {/* Client name */}
      <h3 className="font-jost font-bold text-xl text-nex-white mb-3">
        {caseStudy.client}
      </h3>

      {/* Pain excerpt */}
      <p className="font-jost text-sm text-nex-grey leading-relaxed mb-4 line-clamp-3 flex-1">
        {painHeadline}
      </p>

      {/* Metric badge */}
      {firstMetric && (
        <div className="mb-4">
          <span className="inline-block bg-nex-green/10 text-nex-green rounded-full px-3 py-1 text-xs font-mono font-semibold">
            {firstMetric.value} {pick(firstMetric.label, locale)}
          </span>
        </div>
      )}

      {caseStudy.videoUrl && (
        <Link
          href={href}
          className="font-dm-mono text-xs text-nex-green uppercase tracking-widest hover:underline mt-auto"
        >
          {t('viewCase')} →
        </Link>
      )}
    </div>
  )
}
