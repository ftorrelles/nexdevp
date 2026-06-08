import { getTranslations } from 'next-intl/server'
import { SectionShell } from '@/components/editorial/SectionShell'
import { DualCTA } from '@/components/cta/DualCTA'

export async function LeadCapture() {
  const t = await getTranslations('leadCapture')

  return (
    <div className="bg-black">
      <SectionShell eyebrow={t('eyebrow')} heading={t('heading')}>
        <div className="max-w-2xl">
          <p className="font-jost text-base text-muted leading-relaxed mb-8">
            {t('subheading')}
          </p>
          <DualCTA variant="section" />
        </div>
      </SectionShell>
    </div>
  )
}
