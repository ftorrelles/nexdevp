import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { CaseCard } from '@/components/case/CaseCard'
import { Reveal } from '@/components/editorial/Reveal'
import type { CaseStudy, Locale } from '@/content/types'

interface CasesProps {
  cases: CaseStudy[]
  locale: Locale
}

export async function Cases({ cases, locale }: CasesProps) {
  const t = await getTranslations('cases')

  return (
    <div className="bg-surface">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <Reveal key={c.id}>
              <CaseCard caseStudy={c} locale={locale} />
            </Reveal>
          ))}
        </div>
      </SectionShell>
    </div>
  )
}
