import { getTranslations } from 'next-intl/server'
import { CaseCard } from '@/components/case/CaseCard'
import type { CaseStudy, Locale } from '@/content/types'

interface CasesProps {
  cases: CaseStudy[]
  locale: Locale
}

export async function Cases({ cases, locale }: CasesProps) {
  const t = await getTranslations('cases')

  return (
    <section className="bg-nex-dark py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.2em] mb-4">
          {t('eyebrow')}
        </p>
        <h2 className="font-jost font-bold text-4xl lg:text-5xl text-nex-white mb-12">
          {t('heading')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <CaseCard key={c.id} caseStudy={c} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
